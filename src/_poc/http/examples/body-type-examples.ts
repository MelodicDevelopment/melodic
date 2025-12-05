/**
 * Better Type Options for HTTP Request Body
 *
 * Shows various approaches to type the body parameter better than 'any'
 */

// ============================================
// Option 1: Use BodyInit (Fetch API standard)
// ============================================

/**
 * BodyInit is the built-in TypeScript type for fetch() body
 * Includes: Blob | BufferSource | FormData | URLSearchParams | string
 */

interface Example1 {
	post<T>(url: string, body?: BodyInit | null, config?: any): Promise<T>;
}

// Usage:
// client.post('/api', new FormData())
// client.post('/api', new Blob([data]))
// client.post('/api', JSON.stringify(data))

// ============================================
// Option 2: JSON-Serializable Type
// ============================================

/**
 * Type for objects that can be JSON.stringify'd
 * Excludes functions, undefined, symbols
 */

type JsonPrimitive = string | number | boolean | null;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

interface Example2 {
	post<T>(url: string, body?: JsonValue, config?: any): Promise<T>;
}

// Usage:
// client.post('/api', { name: 'John', age: 30 })
// client.post('/api', ['item1', 'item2'])
// client.post('/api', 'plain text')

// ============================================
// Option 3: Union of Common Types (RECOMMENDED)
// ============================================

/**
 * Combines BodyInit with JSON-serializable objects
 * This is the most flexible and type-safe approach
 */

type HttpRequestBody =
	| BodyInit  // FormData, Blob, ArrayBuffer, URLSearchParams, ReadableStream, string
	| JsonValue // Plain objects, arrays, primitives
	| null
	| undefined;

interface Example3 {
	post<T>(url: string, body?: HttpRequestBody, config?: any): Promise<T>;
}

// Usage - accepts everything:
// client.post('/api', { user: 'john' })           // JSON object
// client.post('/api', new FormData())              // FormData
// client.post('/api', new Blob([data]))            // Blob
// client.post('/api', JSON.stringify({ x: 1 }))    // String

// ============================================
// Option 4: Generic Body Type
// ============================================

/**
 * Use a generic to let callers specify the body type
 * Great for strongly-typed APIs
 */

interface Example4 {
	post<TResponse, TBody = unknown>(
		url: string,
		body?: TBody,
		config?: any
	): Promise<TResponse>;
}

// Usage with strong typing:
interface CreateUserRequest {
	name: string;
	email: string;
	age: number;
}

interface UserResponse {
	id: string;
	name: string;
	email: string;
}

// Type-safe call:
// const user = await client.post<UserResponse, CreateUserRequest>(
//   '/users',
//   { name: 'John', email: 'john@example.com', age: 30 }
// );

// ============================================
// Option 5: Branded Types for Specific Content
// ============================================

/**
 * Create specific types for different content types
 * Useful when you want to enforce correct usage
 */

type JsonBody<T = JsonValue> = T & { readonly __brand: 'json' };
type FormDataBody = FormData & { readonly __brand: 'formdata' };

function asJson<T extends JsonValue>(data: T): JsonBody<T> {
	return data as JsonBody<T>;
}

interface Example5 {
	post<T>(url: string, body?: JsonBody | FormDataBody | BodyInit, config?: any): Promise<T>;
}

// Usage:
// client.post('/api', asJson({ name: 'John' }))

// ============================================
// Option 6: Discriminated Union
// ============================================

/**
 * Use a discriminated union to handle different body types
 * with automatic serialization
 */

type RequestBodyConfig =
	| { type: 'json'; data: JsonValue }
	| { type: 'formdata'; data: FormData }
	| { type: 'blob'; data: Blob }
	| { type: 'text'; data: string }
	| { type: 'raw'; data: BodyInit };

interface Example6 {
	post<T>(url: string, body?: RequestBodyConfig, config?: any): Promise<T>;
}

// Usage:
// client.post('/api', { type: 'json', data: { name: 'John' } })
// client.post('/api', { type: 'formdata', data: formData })

// ============================================
// RECOMMENDED IMPLEMENTATION
// ============================================

/**
 * The best general-purpose approach combines:
 * 1. Union of BodyInit and JsonValue for flexibility
 * 2. Optional generic for request body typing
 * 3. Helper type guards for internal handling
 */

export type HttpBody = BodyInit | JsonValue | null | undefined;

export class HttpClientWithTypedBody {
	/**
	 * POST method with well-typed body
	 *
	 * @param url - The URL to POST to
	 * @param body - Request body (JSON object, FormData, Blob, etc.)
	 * @param config - Additional request configuration
	 *
	 * @example
	 * // JSON body
	 * await client.post<User>('/users', { name: 'John', age: 30 });
	 *
	 * @example
	 * // FormData body
	 * const form = new FormData();
	 * form.append('file', file);
	 * await client.post<UploadResponse>('/upload', form);
	 */
	async post<TResponse = unknown, TBody extends HttpBody = HttpBody>(
		url: string,
		body?: TBody,
		config?: any
	): Promise<TResponse> {
		// Prepare body based on type
		const preparedBody = this.prepareBody(body);

		// Make request...
		return {} as TResponse;
	}

	/**
	 * Helper to prepare body for fetch
	 */
	private prepareBody(body: HttpBody): BodyInit | null {
		if (body === null || body === undefined) {
			return null;
		}

		// Already BodyInit types (FormData, Blob, etc.)
		if (
			body instanceof FormData ||
			body instanceof Blob ||
			body instanceof ArrayBuffer ||
			body instanceof URLSearchParams ||
			body instanceof ReadableStream ||
			typeof body === 'string'
		) {
			return body as BodyInit;
		}

		// JSON-serializable object/array
		return JSON.stringify(body);
	}

	/**
	 * Type guard to check if body is JSON-serializable
	 */
	private isJsonBody(body: HttpBody): body is JsonValue {
		if (body === null || body === undefined) return false;

		const type = typeof body;
		return (
			type === 'string' ||
			type === 'number' ||
			type === 'boolean' ||
			(type === 'object' && !(
				body instanceof FormData ||
				body instanceof Blob ||
				body instanceof ArrayBuffer ||
				body instanceof URLSearchParams ||
				body instanceof ReadableStream
			))
		);
	}
}

// ============================================
// Usage Examples
// ============================================

const client = new HttpClientWithTypedBody();

// Example 1: JSON body with response typing
interface CreatePostRequest {
	title: string;
	body: string;
	userId: number;
}

interface Post {
	id: number;
	title: string;
	body: string;
	userId: number;
}

async function createPost() {
	const newPost: CreatePostRequest = {
		title: 'My Post',
		body: 'Post content',
		userId: 1
	};

	// Fully typed - body and response
	const post = await client.post<Post, CreatePostRequest>('/posts', newPost);
	console.log(post.id); // TypeScript knows this exists
}

// Example 2: FormData body
async function uploadFile(file: File) {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('name', file.name);

	interface UploadResponse {
		fileId: string;
		url: string;
	}

	const response = await client.post<UploadResponse>('/upload', formData);
	console.log(response.url);
}

// Example 3: Simple JSON
async function simplePost() {
	await client.post('/api/log', {
		event: 'page_view',
		timestamp: Date.now()
	});
}

// Example 4: Blob body
async function uploadBlob() {
	const blob = new Blob(['file contents'], { type: 'text/plain' });
	await client.post('/upload', blob);
}

export {
	JsonPrimitive,
	JsonArray,
	JsonObject,
	JsonValue,
	HttpRequestBody,
	RequestBodyConfig,
	createPost,
	uploadFile,
	simplePost,
	uploadBlob
};
