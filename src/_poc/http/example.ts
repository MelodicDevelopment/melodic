/**
 * HTTP Client - Usage Examples
 */

import { HttpClient, HTTPError, NetworkError, TimeoutError } from './index';

// ============================================
// 1. Create a client instance
// ============================================

const client = new HttpClient({
	baseURL: 'https://jsonplaceholder.typicode.com',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json'
	},
	cache: {
		enabled: true,
		ttl: 60000,
		storage: 'memory'
	},
	retry: {
		maxAttempts: 2,
		delay: 1000,
		backoff: 'exponential'
	}
});

// ============================================
// 2. Add interceptors
// ============================================

// Request interceptor - add authentication
client.request.use(
	(config: any) => {
		// Simulate adding auth token
		const token = 'your-auth-token';
		config.headers = {
			...config.headers,
			'Authorization': `Bearer ${token}`,
			'X-Request-Time': new Date().toISOString()
		};
		console.log('→ Request:', config.method, config.url);
		return config;
	},
	(error: Error) => {
		console.error('Request error:', error);
		throw error;
	}
);

// Response interceptor - log responses
client.response.use(
	(response: any) => {
		console.log('← Response:', response.status, response.config.url);
		if (response.timing) {
			console.log(`  Duration: ${response.timing.duration.toFixed(2)}ms`);
		}
		return response;
	},
	(error: Error) => {
		console.error('Response error:', error);
		throw error;
	}
);

// ============================================
// 3. Type definitions for API responses
// ============================================

interface User {
	id: number;
	name: string;
	email: string;
	username: string;
}

interface Post {
	id: number;
	userId: number;
	title: string;
	body: string;
}

interface Comment {
	id: number;
	postId: number;
	name: string;
	email: string;
	body: string;
}

// ============================================
// 4. Basic GET requests
// ============================================

async function getUsers() {
	try {
		const response = await client.get<User[]>('/users');
		console.log('Users:', response.data);
		return response.data;
	} catch (error) {
		handleError(error);
	}
}

async function getUserById(id: number) {
	try {
		const response = await client.get<User>(`/users/${id}`);
		console.log('User:', response.data);
		return response.data;
	} catch (error) {
		handleError(error);
	}
}

// ============================================
// 5. GET with query parameters
// ============================================

async function getUserPosts(userId: number) {
	try {
		const response = await client.get<Post[]>('/posts', {
			params: {
				userId,
				_limit: 10
			}
		});
		console.log('Posts:', response.data);
		return response.data;
	} catch (error) {
		handleError(error);
	}
}

// ============================================
// 6. POST, PUT, PATCH, DELETE
// ============================================

async function createPost(post: Omit<Post, 'id'>) {
	try {
		const response = await client.post<Post>('/posts', post);
		console.log('Created post:', response.data);
		return response.data;
	} catch (error) {
		handleError(error);
	}
}

async function updatePost(id: number, post: Partial<Post>) {
	try {
		const response = await client.patch<Post>(`/posts/${id}`, post);
		console.log('Updated post:', response.data);
		return response.data;
	} catch (error) {
		handleError(error);
	}
}

async function deletePost(id: number) {
	try {
		await client.delete(`/posts/${id}`);
		console.log('Deleted post:', id);
	} catch (error) {
		handleError(error);
	}
}

// ============================================
// 7. Caching examples
// ============================================

async function getCachedUsers() {
	console.log('\n--- Caching Demo ---');

	// First request: fetches from server
	console.log('First request (from server):');
	const response1 = await client.get<User[]>('/users', {
		cache: {
			enabled: true,
			ttl: 30000, // Cache for 30 seconds
			storage: 'memory'
		}
	});
	console.log('Users count:', response1.data.length);

	// Second request: returns from cache
	console.log('\nSecond request (from cache):');
	const response2 = await client.get<User[]>('/users', {
		cache: {
			enabled: true,
			ttl: 30000
		}
	});
	console.log('Users count:', response2.data.length);

	// Third request: bust cache
	console.log('\nThird request (cache bust):');
	const response3 = await client.get<User[]>('/users', {
		cache: {
			enabled: true,
			bustCache: true // Force fresh data
		}
	});
	console.log('Users count:', response3.data.length);
}

// ============================================
// 8. Request deduplication
// ============================================

async function demonstrateDeduplication() {
	console.log('\n--- Deduplication Demo ---');
	console.log('Making 5 identical requests simultaneously...');

	const startTime = performance.now();

	// All 5 requests will share the same network call
	const [r1, r2, r3, r4, r5] = await Promise.all([
		client.get<User[]>('/users'),
		client.get<User[]>('/users'),
		client.get<User[]>('/users'),
		client.get<User[]>('/users'),
		client.get<User[]>('/users')
	]);

	const duration = performance.now() - startTime;

	console.log('All requests completed in:', duration.toFixed(2), 'ms');
	console.log('Users count:', r1.data.length, r2.data.length, r3.data.length);
	console.log('(Only ONE network request was made!)');
}

// ============================================
// 9. Progress tracking
// ============================================

async function uploadWithProgress() {
	console.log('\n--- Progress Tracking Demo ---');

	// Create some dummy data
	const formData = new FormData();
	const blob = new Blob(['x'.repeat(1000000)], { type: 'text/plain' }); // 1MB
	formData.append('file', blob, 'test.txt');

	try {
		await client.post('/posts', formData, {
			onProgress: (progress) => {
				console.log(
					`${progress.phase}: ${progress.percentage.toFixed(1)}% ` +
					`(${progress.loaded} / ${progress.total} bytes)`
				);
			}
		});
	} catch (error) {
		// JSONPlaceholder doesn't support file uploads, so this will fail
		console.log('(Expected failure - demo endpoint does not support uploads)');
	}
}

// ============================================
// 10. Retry logic
// ============================================

async function requestWithRetry() {
	console.log('\n--- Retry Logic Demo ---');

	try {
		// This will fail and retry
		const response = await client.get('/invalid-endpoint', {
			retry: {
				maxAttempts: 3,
				delay: 1000,
				backoff: 'exponential',
				retryOn: [404, 500, 502, 503]
			}
		});
		console.log('Response:', response.data);
	} catch (error) {
		console.log('Failed after retries');
	}
}

// ============================================
// 11. Timeout management
// ============================================

async function requestWithTimeout() {
	console.log('\n--- Timeout Demo ---');

	try {
		// Simulate timeout with a very short timeout
		const response = await client.get('/users', {
			timeout: 1 // 1ms - will definitely timeout
		});
		console.log('Response:', response.data);
	} catch (error) {
		if (error instanceof TimeoutError) {
			console.log('Request timed out after', error.timeout, 'ms');
		}
	}
}

// ============================================
// 12. Error handling
// ============================================

function handleError(error: unknown) {
	if (error instanceof HTTPError) {
		console.error(`HTTP Error ${error.response.status}:`, error.message);
		console.error('Response data:', error.response.data);
	} else if (error instanceof NetworkError) {
		console.error('Network Error:', error.message);
		console.error('Check your internet connection');
	} else if (error instanceof TimeoutError) {
		console.error('Timeout Error:', error.message);
		console.error(`Request timed out after ${error.timeout}ms`);
	} else {
		console.error('Unknown error:', error);
	}
}

// ============================================
// 13. Concurrent requests
// ============================================

async function loadDashboardData() {
	console.log('\n--- Concurrent Requests Demo ---');

	const startTime = performance.now();

	try {
		// Load multiple resources in parallel
		const [users, posts, comments] = await Promise.all([
			client.get<User[]>('/users'),
			client.get<Post[]>('/posts', { params: { _limit: 10 } }),
			client.get<Comment[]>('/comments', { params: { _limit: 10 } })
		]);

		const duration = performance.now() - startTime;

		console.log('Dashboard data loaded in:', duration.toFixed(2), 'ms');
		console.log('Users:', users.data.length);
		console.log('Posts:', posts.data.length);
		console.log('Comments:', comments.data.length);

		return { users: users.data, posts: posts.data, comments: comments.data };
	} catch (error) {
		handleError(error);
	}
}

// ============================================
// 14. Custom headers per request
// ============================================

async function requestWithCustomHeaders() {
	const response = await client.get<User[]>('/users', {
		headers: {
			'X-Custom-Header': 'custom-value',
			'Accept-Language': 'en-US'
		}
	});
	return response.data;
}

// ============================================
// 15. Cancel all requests
// ============================================

function setupCancellation() {
	// In a real app, you might want to cancel all requests when navigating away
	window.addEventListener('beforeunload', () => {
		console.log('Canceling all pending requests...');
		client.cancelAll('Page unload');
	});
}

// ============================================
// Run examples
// ============================================

export async function runExamples() {
	console.log('='.repeat(50));
	console.log('HTTP Client Examples');
	console.log('='.repeat(50));

	// Basic requests
	await getUsers();
	await getUserById(1);
	await getUserPosts(1);

	// Create, update, delete
	await createPost({
		userId: 1,
		title: 'Test Post',
		body: 'This is a test post'
	});

	// Advanced features
	await getCachedUsers();
	await demonstrateDeduplication();
	await uploadWithProgress();
	await requestWithRetry();
	await requestWithTimeout();
	await loadDashboardData();

	// Setup cancellation
	setupCancellation();

	console.log('\n' + '='.repeat(50));
	console.log('Examples completed!');
	console.log('='.repeat(50));
}

// Uncomment to run examples
// runExamples();
