/**
 * HTTP Client with Silent Cancellation Support
 *
 * A modified version of HttpClient that allows interceptors to cancel
 * requests without throwing exceptions.
 */

import type {
	HttpMethod,
	RequestConfig,
	HttpResponse,
	HttpClientConfig,
} from './types';
import { HttpCache } from './cache';
import { InterceptorManager } from './interceptor';
import { RequestManager } from './request-manager';
import { NetworkError, TimeoutError, AbortError, HTTPError } from './errors';

// Extended config type with cancellation support
export interface CancellableRequestConfig extends RequestConfig {
	_cancelled?: boolean;
	_cancelledResponse?: HttpResponse<any>;
	_cancelReason?: string;
}

export class HttpClientWithSilentCancel {
	private config: HttpClientConfig;
	private cache: HttpCache;
	private interceptors: InterceptorManager;
	private requestManager: RequestManager;

	constructor(config: HttpClientConfig = {}) {
		this.config = {
			timeout: 30000,
			headers: {},
			cache: { enabled: false },
			retry: { maxAttempts: 0 },
			...config
		};

		this.cache = new HttpCache();
		this.interceptors = new InterceptorManager();
		this.requestManager = new RequestManager();
	}

	get request() {
		return {
			use: (onFulfilled?: any, onRejected?: any) => {
				return this.interceptors.addRequestInterceptor({ onFulfilled, onRejected });
			}
		};
	}

	get response() {
		return {
			use: (onFulfilled?: any, onRejected?: any) => {
				return this.interceptors.addResponseInterceptor({ onFulfilled, onRejected });
			}
		};
	}

	async get<T = any>(url: string, config?: CancellableRequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'GET', url });
	}

	async post<T = any>(url: string, body?: any, config?: CancellableRequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'POST', url, body });
	}

	async put<T = any>(url: string, body?: any, config?: CancellableRequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'PUT', url, body });
	}

	async delete<T = any>(url: string, config?: CancellableRequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'DELETE', url });
	}

	/**
	 * Core request method with silent cancellation support
	 */
	private async request_internal<T = any>(
		config: CancellableRequestConfig & { url?: string }
	): Promise<HttpResponse<T>> {
		// Merge with default config
		const mergedConfig = this.mergeConfig(config);

		// Run request interceptors
		const interceptedConfig = await this.interceptors.runRequestInterceptors(mergedConfig);

		// *** KEY MODIFICATION: Check for silent cancellation ***
		if ((interceptedConfig as CancellableRequestConfig)._cancelled) {
			const cancelledConfig = interceptedConfig as CancellableRequestConfig;

			// Log cancellation for debugging (optional)
			if (cancelledConfig._cancelReason) {
				console.log('[HttpClient] Request cancelled:', cancelledConfig._cancelReason);
			}

			// Return provided response or default cancelled response
			if (cancelledConfig._cancelledResponse) {
				return cancelledConfig._cancelledResponse as HttpResponse<T>;
			}

			// Return default cancelled response (no exception thrown)
			return {
				data: null as T,
				status: 0,
				statusText: 'Cancelled',
				headers: new Headers(),
				config: cancelledConfig,
				timing: {
					start: 0,
					end: 0,
					duration: 0
				}
			};
		}

		// Build full URL
		const fullUrl = this.buildUrl(interceptedConfig.url!, interceptedConfig.params);
		const method = interceptedConfig.method || 'GET';

		// Check cache
		const cacheStrategy = interceptedConfig.cache || this.config.cache!;
		if (cacheStrategy.enabled && method === 'GET' && !cacheStrategy.bustCache) {
			const cacheKey = this.cache.generateKey(method, fullUrl);
			const cachedEntry = this.cache.get<T>(cacheKey);

			if (cachedEntry) {
				return {
					data: cachedEntry.data,
					status: 200,
					statusText: 'OK (Cached)',
					headers: new Headers(cachedEntry.headers),
					config: interceptedConfig
				};
			}
		}

		// Create abort controller
		const abortController = new AbortController();
		const timeoutId = this.setupTimeout(abortController, interceptedConfig.timeout || this.config.timeout!);

		try {
			// Make the request
			const response = await this.executeRequest<T>(
				fullUrl,
				method,
				interceptedConfig,
				abortController
			);

			clearTimeout(timeoutId);

			// Cache successful GET requests
			if (method === 'GET' && interceptedConfig.cache?.enabled) {
				this.cacheResponse(fullUrl, method, interceptedConfig, response);
			}

			// Run response interceptors
			const interceptedResponse = await this.interceptors.runResponseInterceptors(response);

			return interceptedResponse;
		} catch (error) {
			clearTimeout(timeoutId);

			// Run error interceptors
			await this.interceptors.runResponseErrorInterceptors(error as Error);

			throw error;
		}
	}

	private async executeRequest<T>(
		url: string,
		method: HttpMethod,
		config: RequestConfig,
		abortController: AbortController
	): Promise<HttpResponse<T>> {
		const startTime = performance.now();

		const init: RequestInit = {
			method,
			headers: this.buildHeaders(config.headers),
			body: this.prepareBody(config.body),
			signal: config.signal || abortController.signal,
			credentials: config.credentials || this.config.credentials,
			mode: config.mode || this.config.mode
		};

		let fetchResponse: Response;

		try {
			fetchResponse = await fetch(url, init);
		} catch (error: any) {
			if (error.name === 'AbortError') {
				throw new AbortError('Request aborted', config);
			}
			throw new NetworkError(error.message || 'Network error', config);
		}

		const data = await this.parseResponse<T>(fetchResponse);

		const response: HttpResponse<T> = {
			data,
			status: fetchResponse.status,
			statusText: fetchResponse.statusText,
			headers: fetchResponse.headers,
			config,
			timing: {
				start: startTime,
				end: performance.now(),
				duration: performance.now() - startTime
			}
		};

		if (!fetchResponse.ok) {
			throw new HTTPError(
				`HTTP Error: ${fetchResponse.status} ${fetchResponse.statusText}`,
				response,
				config
			);
		}

		return response;
	}

	private async parseResponse<T>(response: Response): Promise<T> {
		const contentType = response.headers.get('content-type') || '';

		if (contentType.includes('application/json')) {
			return await response.json();
		}

		if (contentType.includes('text/')) {
			return await response.text() as any;
		}

		return await response.text() as any;
	}

	private cacheResponse<T>(url: string, method: HttpMethod, config: RequestConfig, response: HttpResponse<T>): void {
		const cacheStrategy = config.cache || this.config.cache!;
		const cacheKey = this.cache.generateKey(method, url);
		const ttl = config.cacheTTL || cacheStrategy.ttl || 300000;
		const storage = cacheStrategy.storage || 'memory';

		const headers: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			headers[key] = value;
		});

		this.cache.set(cacheKey, response.data, ttl, storage, undefined, headers);
	}

	private setupTimeout(abortController: AbortController, timeout: number): number {
		return setTimeout(() => {
			abortController.abort(new TimeoutError(timeout, {} as RequestConfig));
		}, timeout) as unknown as number;
	}

	private buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
		const baseUrl = this.config.baseURL || '';
		let fullUrl = baseUrl + url;

		if (params) {
			const queryString = new URLSearchParams(
				Object.entries(params).map(([key, value]) => [key, String(value)])
			).toString();

			fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
		}

		return fullUrl;
	}

	private buildHeaders(headers?: Record<string, string>): HeadersInit {
		return {
			...this.config.headers,
			...headers
		};
	}

	private prepareBody(body?: any): BodyInit | null {
		if (!body) return null;

		if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) {
			return body;
		}

		if (typeof body === 'object') {
			return JSON.stringify(body);
		}

		return body;
	}

	private mergeConfig(config: CancellableRequestConfig & { url?: string }): CancellableRequestConfig & { url?: string } {
		return {
			...this.config,
			...config,
			headers: {
				...this.config.headers,
				...config.headers
			}
		};
	}

	clearCache(): void {
		this.cache.clear();
	}
}

// ============================================
// Usage Example
// ============================================

const client = new HttpClientWithSilentCancel({
	baseURL: 'https://api.example.com'
});

// Add interceptor that silently cancels
client.request.use((config: CancellableRequestConfig) => {
	const token = localStorage.getItem('auth_token');

	if (!token) {
		// Set cancellation flag - NO EXCEPTION THROWN
		config._cancelled = true;
		config._cancelReason = 'No authentication token';
		config._cancelledResponse = {
			data: { error: 'Unauthorized', message: 'Please log in' },
			status: 401,
			statusText: 'Unauthorized',
			headers: new Headers(),
			config
		};
		return config;
	}

	config.headers = {
		...config.headers,
		'Authorization': `Bearer ${token}`
	};

	return config;
});

// Usage - no exception handling needed!
async function fetchData() {
	const response = await client.get('/protected/data');

	// Check if request was cancelled
	if (response.status === 401) {
		console.log('Not authenticated:', response.data);
		// Redirect to login page
		return;
	}

	if (response.status === 0) {
		console.log('Request was cancelled silently');
		return;
	}

	// Normal response handling
	console.log('Data:', response.data);
}

export { client, fetchData };
