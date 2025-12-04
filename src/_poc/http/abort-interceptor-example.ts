/**
 * Examples: Aborting Requests in Interceptors
 *
 * Shows various ways to kill/abort HTTP requests before they're sent
 * by throwing errors in request interceptors.
 */

import { HttpClient, AbortError } from './index';
import type { RequestConfig } from './types';

// ============================================
// Example 1: Abort based on missing auth token
// ============================================

const client1 = new HttpClient({
	baseURL: 'https://api.example.com'
});

client1.request.use(
	(config: RequestConfig) => {
		const token = getAuthToken(); // Your auth logic

		if (!token) {
			// Kill the request by throwing an error
			throw new AbortError('No authentication token available', config);
		}

		config.headers = {
			...config.headers,
			'Authorization': `Bearer ${token}`
		};

		return config;
	},
	(error: Error) => {
		console.error('Request interceptor error:', error);
		throw error;
	}
);

// Usage:
async function fetchProtectedData() {
	try {
		const response = await client1.get('/protected/data');
		console.log('Data:', response.data);
	} catch (error) {
		if (error instanceof AbortError) {
			console.log('Request aborted:', error.message);
			// Redirect to login or show auth modal
		}
	}
}

// ============================================
// Example 2: Abort based on custom validation
// ============================================

const client2 = new HttpClient({
	baseURL: 'https://api.example.com'
});

// Custom error for validation failures
class RequestValidationError extends Error {
	constructor(message: string, public readonly config: RequestConfig) {
		super(message);
		this.name = 'RequestValidationError';
	}
}

client2.request.use((config: RequestConfig) => {
	// Kill requests to blacklisted URLs
	const blacklist = ['/admin', '/internal'];
	const isBlacklisted = blacklist.some(path => config.url?.includes(path));

	if (isBlacklisted) {
		throw new RequestValidationError(
			`Request to ${config.url} is not allowed`,
			config
		);
	}

	// Kill requests with invalid payload size
	if (config.body && typeof config.body === 'string') {
		const size = new Blob([config.body]).size;
		const maxSize = 5 * 1024 * 1024; // 5MB

		if (size > maxSize) {
			throw new RequestValidationError(
				`Request body too large: ${size} bytes (max: ${maxSize})`,
				config
			);
		}
	}

	return config;
});

// ============================================
// Example 3: Abort based on rate limiting
// ============================================

const client3 = new HttpClient({
	baseURL: 'https://api.example.com'
});

// Simple in-memory rate limiter
class RateLimiter {
	private requests: Map<string, number[]> = new Map();

	canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
		const now = Date.now();
		const timestamps = this.requests.get(key) || [];

		// Remove old timestamps outside the window
		const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

		if (validTimestamps.length >= maxRequests) {
			return false;
		}

		validTimestamps.push(now);
		this.requests.set(key, validTimestamps);
		return true;
	}

	getRetryAfter(key: string, windowMs: number): number {
		const timestamps = this.requests.get(key) || [];
		if (timestamps.length === 0) return 0;

		const oldestTimestamp = Math.min(...timestamps);
		const retryAfter = windowMs - (Date.now() - oldestTimestamp);
		return Math.max(0, retryAfter);
	}
}

const rateLimiter = new RateLimiter();

class RateLimitError extends Error {
	constructor(
		message: string,
		public readonly retryAfter: number,
		public readonly config: RequestConfig
	) {
		super(message);
		this.name = 'RateLimitError';
	}
}

client3.request.use((config: RequestConfig) => {
	const endpoint = config.url || '';
	const canProceed = rateLimiter.canMakeRequest(
		endpoint,
		5,    // Max 5 requests
		60000 // Per 60 seconds
	);

	if (!canProceed) {
		const retryAfter = rateLimiter.getRetryAfter(endpoint, 60000);

		throw new RateLimitError(
			`Rate limit exceeded for ${endpoint}. Retry after ${Math.ceil(retryAfter / 1000)}s`,
			retryAfter,
			config
		);
	}

	return config;
});

// Usage with retry logic:
async function fetchWithRateLimit() {
	try {
		const response = await client3.get('/api/data');
		return response.data;
	} catch (error) {
		if (error instanceof RateLimitError) {
			console.log(`Rate limited. Retrying after ${error.retryAfter}ms...`);

			// Wait and retry
			await new Promise(resolve => setTimeout(resolve, error.retryAfter));
			return fetchWithRateLimit(); // Retry
		}
		throw error;
	}
}

// ============================================
// Example 4: Abort based on user permissions
// ============================================

const client4 = new HttpClient({
	baseURL: 'https://api.example.com'
});

interface UserPermissions {
	canRead: boolean;
	canWrite: boolean;
	canDelete: boolean;
}

class PermissionError extends Error {
	constructor(
		message: string,
		public readonly requiredPermission: string,
		public readonly config: RequestConfig
	) {
		super(message);
		this.name = 'PermissionError';
	}
}

function getUserPermissions(): UserPermissions {
	// Your permission logic here
	return {
		canRead: true,
		canWrite: false,
		canDelete: false
	};
}

client4.request.use((config: RequestConfig) => {
	const permissions = getUserPermissions();
	const method = config.method?.toUpperCase();

	// Map HTTP methods to permissions
	const permissionMap: Record<string, keyof UserPermissions> = {
		'GET': 'canRead',
		'POST': 'canWrite',
		'PUT': 'canWrite',
		'PATCH': 'canWrite',
		'DELETE': 'canDelete'
	};

	const requiredPermission = method ? permissionMap[method] : 'canRead';

	if (requiredPermission && !permissions[requiredPermission]) {
		throw new PermissionError(
			`Insufficient permissions: ${requiredPermission} required for ${method} ${config.url}`,
			requiredPermission,
			config
		);
	}

	return config;
});

// ============================================
// Example 5: Abort duplicate requests
// ============================================

const client5 = new HttpClient({
	baseURL: 'https://api.example.com',
	// Note: The HttpClient already has built-in deduplication
	// but this shows how you could do it manually in an interceptor
});

class DuplicateRequestError extends Error {
	constructor(message: string, public readonly config: RequestConfig) {
		super(message);
		this.name = 'DuplicateRequestError';
	}
}

const pendingRequests = new Set<string>();

client5.request.use((config: RequestConfig) => {
	// Create a unique key for this request
	const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.body)}`;

	if (pendingRequests.has(requestKey)) {
		throw new DuplicateRequestError(
			`Duplicate request blocked: ${config.method} ${config.url}`,
			config
		);
	}

	pendingRequests.add(requestKey);

	// Clean up after request completes (you'd do this in response interceptor)
	// This is just for demonstration
	setTimeout(() => {
		pendingRequests.delete(requestKey);
	}, 100);

	return config;
});

// ============================================
// Example 6: Abort based on offline status
// ============================================

const client6 = new HttpClient({
	baseURL: 'https://api.example.com'
});

class OfflineError extends Error {
	constructor(message: string, public readonly config: RequestConfig) {
		super(message);
		this.name = 'OfflineError';
	}
}

client6.request.use((config: RequestConfig) => {
	if (!navigator.onLine) {
		throw new OfflineError(
			'Cannot make request: Device is offline',
			config
		);
	}

	return config;
});

// ============================================
// Example 7: Conditional abort with async logic
// ============================================

const client7 = new HttpClient({
	baseURL: 'https://api.example.com'
});

async function validateSession(): Promise<boolean> {
	// Simulate async session validation
	return new Promise(resolve => {
		setTimeout(() => resolve(Math.random() > 0.5), 100);
	});
}

client7.request.use(async (config: RequestConfig) => {
	// Request interceptors can be async!
	const isValidSession = await validateSession();

	if (!isValidSession) {
		throw new AbortError('Session expired or invalid', config);
	}

	return config;
});

// ============================================
// Helpers
// ============================================

function getAuthToken(): string | null {
	// Your token retrieval logic
	return localStorage.getItem('auth_token');
}

// ============================================
// Export examples
// ============================================

export {
	client1,
	client2,
	client3,
	client4,
	client5,
	client6,
	client7,
	fetchProtectedData,
	fetchWithRateLimit,
	RequestValidationError,
	RateLimitError,
	PermissionError,
	DuplicateRequestError,
	OfflineError
};
