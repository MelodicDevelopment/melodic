/**
 * HTTP Client with Better Body Typing
 *
 * Example showing how to improve the body type from 'any' to properly typed
 */

import type { IHttpClientConfig } from '../../../http/interfaces/ihttp-client-config.interface';
import type { IHttpRequestInterceptor } from '../../../http/interfaces/ihttp-request-interceptor.interface';
import type { IHttpResponseInterceptor } from '../../../http/interfaces/ihttp-response-interceptor.interface';
import type { IRequestConfig } from '../../../http/interfaces/irequest-config.interface';

export class HttpClient {
	private _interceptors: {
		request: IHttpRequestInterceptor[];
		response: IHttpResponseInterceptor[];
	} = {
		request: [],
		response: []
	};

	public get interceptors() {
		return {
			request: (interceptor: IHttpRequestInterceptor): void => {
				this._interceptors.request.push(interceptor);
			},
			response: (interceptor: IHttpResponseInterceptor): void => {
				this._interceptors.response.push(interceptor);
			}
		};
	}

	constructor(private _clientConfig: IHttpClientConfig) {
		this._clientConfig = {
			headers: {},
			..._clientConfig
		};
	}

	public async get<T>(url: string, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'GET', ...config, url });
	}

	/**
	 * POST request with properly typed body
	 *
	 * @param url - Request URL
	 * @param body - Can be:
	 *   - JSON object: { name: 'John', age: 30 }
	 *   - FormData: new FormData()
	 *   - Blob: new Blob([data])
	 *   - ArrayBuffer, URLSearchParams, ReadableStream, or string
	 * @param config - Additional request configuration
	 *
	 * @example
	 * // JSON body
	 * await client.post<User>('/users', { name: 'John', age: 30 });
	 *
	 * @example
	 * // FormData
	 * const form = new FormData();
	 * form.append('file', file);
	 * await client.post<Response>('/upload', form);
	 */
	public async post<T>(url: string, body?: BodyInit | Record<string, unknown> | null, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({
			method: 'POST',
			...config,
			url,
			body: this.#prepareBody(body)
		});
	}

	/**
	 * PUT request with properly typed body
	 */
	public async put<T>(url: string, body?: BodyInit | Record<string, unknown> | null, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({
			method: 'PUT',
			...config,
			url,
			body: this.#prepareBody(body)
		});
	}

	/**
	 * PATCH request with properly typed body
	 */
	public async patch<T>(url: string, body?: BodyInit | Record<string, unknown> | null, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({
			method: 'PATCH',
			...config,
			url,
			body: this.#prepareBody(body)
		});
	}

	/**
	 * DELETE request
	 */
	public async delete<T>(url: string, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'DELETE', ...config, url });
	}

	/**
	 * Prepare body for fetch request
	 * - BodyInit types are passed through as-is
	 * - Plain objects are JSON.stringify'd
	 */
	#prepareBody(body?: BodyInit | Record<string, unknown> | null): BodyInit | null {
		if (body === null || body === undefined) {
			return null;
		}

		// Already a BodyInit type (FormData, Blob, ArrayBuffer, URLSearchParams, ReadableStream, string)
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

		// Plain object - convert to JSON
		return JSON.stringify(body);
	}

	private async internalRequest<T>(config: IRequestConfig): Promise<T> {
		return this.executeRequest<T>();
	}

	private async executeRequest<T>(): Promise<T> {
		return await Promise.resolve({} as T);
	}
}

// ============================================
// Usage Examples
// ============================================

const client = new HttpClient({
	baseURL: 'https://api.example.com',
	headers: {
		'Content-Type': 'application/json'
	}
});

// Example 1: JSON object body (most common)
interface CreateUserDto {
	name: string;
	email: string;
	age: number;
}

interface User {
	id: string;
	name: string;
	email: string;
	age: number;
}

async function createUser() {
	const newUser: CreateUserDto = {
		name: 'John Doe',
		email: 'john@example.com',
		age: 30
	};

	// TypeScript knows both request and response types
	const user = await client.post<User>('/users', newUser);
	console.log(user.id); // ✓ Type-safe access
}

// Example 2: FormData body (file uploads)
async function uploadFile(file: File) {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('description', 'Profile picture');

	interface UploadResponse {
		fileId: string;
		url: string;
		size: number;
	}

	const response = await client.post<UploadResponse>('/upload', formData);
	console.log(response.url);
}

// Example 3: Blob body
async function uploadBinaryData(data: Uint8Array) {
	const blob = new Blob([data], { type: 'application/octet-stream' });

	interface BinaryUploadResponse {
		checksum: string;
		size: number;
	}

	const response = await client.post<BinaryUploadResponse>('/binary', blob);
	console.log(response.checksum);
}

// Example 4: String body
async function postRawText(text: string) {
	await client.post('/log', text);
}

// Example 5: URLSearchParams body
async function submitForm(formElement: HTMLFormElement) {
	const formData = new URLSearchParams(new FormData(formElement) as any);
	await client.post('/form', formData);
}

// Example 6: Nested JSON objects
async function createPost() {
	await client.post('/posts', {
		title: 'My Post',
		content: 'Post content here',
		tags: ['typescript', 'http', 'client'],
		metadata: {
			publishedAt: new Date().toISOString(),
			author: {
				id: '123',
				name: 'John'
			}
		}
	});
}

// Example 7: PUT/PATCH with typed body
async function updateUser(userId: string) {
	// Partial update with PATCH
	await client.patch<User>(`/users/${userId}`, {
		age: 31 // Only updating age
	});

	// Full replacement with PUT
	await client.put<User>(`/users/${userId}`, {
		name: 'John Doe',
		email: 'john@example.com',
		age: 31
	});
}

export { createUser, uploadFile, uploadBinaryData, postRawText, submitForm, createPost, updateUser };
