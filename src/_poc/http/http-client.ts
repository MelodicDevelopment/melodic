/**
 * HTTP Client
 */

import type {
	HttpMethod,
	RequestConfig,
	HttpResponse,
	HttpClientConfig,
	ProgressEvent,
	RetryConfig
} from './types';
import { HttpCache } from './cache';
import { InterceptorManager } from './interceptor';
import { RequestManager } from './request-manager';
import { NetworkError, TimeoutError, AbortError, HTTPError } from './errors';

export class HttpClient {
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

	/**
	 * Interceptor API (Axios-style)
	 */
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

	/**
	 * HTTP Methods
	 */
	async get<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'GET', url });
	}

	async post<T = any>(url: string, body?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'POST', url, body });
	}

	async put<T = any>(url: string, body?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'PUT', url, body });
	}

	async patch<T = any>(url: string, body?: any, config?: RequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'PATCH', url, body });
	}

	async delete<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'DELETE', url });
	}

	async head<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'HEAD', url });
	}

	async options<T = any>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
		return this.request_internal<T>({ ...config, method: 'OPTIONS', url });
	}

	/**
	 * Core request method
	 */
	private async request_internal<T = any>(config: RequestConfig & { url?: string }): Promise<HttpResponse<T>> {
		// Merge with default config
		const mergedConfig = this.mergeConfig(config);

		// Run request interceptors
		const interceptedConfig = await this.interceptors.runRequestInterceptors(mergedConfig);

		// Build full URL
		const fullUrl = this.buildUrl(interceptedConfig.url!, interceptedConfig.params);
		const method = interceptedConfig.method || 'GET';

		// Check for request deduplication
		if (interceptedConfig.deduplicate !== false) {
			const requestKey = this.requestManager.generateRequestKey(method, fullUrl, interceptedConfig.body);

			if (this.requestManager.hasPendingRequest(requestKey)) {
				const pendingRequest = this.requestManager.getPendingRequest<T>(requestKey);
				if (pendingRequest) {
					return pendingRequest;
				}
			}
		}

		// Check cache
		const cacheStrategy = interceptedConfig.cache || this.config.cache!;
		if (cacheStrategy.enabled && method === 'GET' && !cacheStrategy.bustCache) {
			const cacheKey = this.cache.generateKey(method, fullUrl);
			const cachedEntry = this.cache.get<T>(cacheKey);

			if (cachedEntry) {
				// Check if we should use ETag validation
				if (cachedEntry.etag) {
					interceptedConfig.headers = {
						...interceptedConfig.headers,
						'If-None-Match': cachedEntry.etag
					};
				} else {
					// Return cached response directly
					return {
						data: cachedEntry.data,
						status: 200,
						statusText: 'OK',
						headers: new Headers(cachedEntry.headers),
						config: interceptedConfig
					};
				}
			}
		}

		// Create abort controller
		const abortController = new AbortController();
		const timeoutId = this.setupTimeout(abortController, interceptedConfig.timeout || this.config.timeout!);

		try {
			// Make the request with retry logic
			const response = await this.executeWithRetry<T>(
				fullUrl,
				method,
				interceptedConfig,
				abortController
			);

			clearTimeout(timeoutId);

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

	/**
	 * Execute request with retry logic
	 */
	private async executeWithRetry<T>(
		url: string,
		method: HttpMethod,
		config: RequestConfig,
		abortController: AbortController
	): Promise<HttpResponse<T>> {
		const retryConfig = config.retry || this.config.retry!;
		const maxAttempts = retryConfig.maxAttempts || 0;
		let attempt = 0;
		let lastError: Error | null = null;
		let lastStatus: number | undefined;

		while (attempt <= maxAttempts) {
			try {
				const response = await this.executeRequest<T>(url, method, config, abortController);

				// Cache successful GET requests
				if (method === 'GET' && config.cache?.enabled) {
					this.cacheResponse(url, method, config, response);
				}

				return response;
			} catch (error) {
				lastError = error as Error;
				lastStatus = (error as HTTPError).response?.status;
				attempt++;

				// Don't retry if aborted or on last attempt
				if (error instanceof AbortError || attempt > maxAttempts) {
					throw error;
				}

				// Check if we should retry
				const shouldRetry = this.shouldRetry(lastError, lastStatus, retryConfig, attempt);

				if (!shouldRetry) {
					throw error;
				}

				// Wait before retrying
				await this.delay(this.calculateRetryDelay(attempt, retryConfig));
			}
		}

		throw lastError || new Error('Max retry attempts reached');
	}

	/**
	 * Execute the actual fetch request
	 */
	private async executeRequest<T>(
		url: string,
		method: HttpMethod,
		config: RequestConfig,
		abortController: AbortController
	): Promise<HttpResponse<T>> {
		const startTime = performance.now();

		// Prepare request init
		const init: RequestInit = {
			method,
			headers: this.buildHeaders(config.headers),
			body: this.prepareBody(config.body),
			signal: config.signal || abortController.signal,
			credentials: config.credentials || this.config.credentials,
			mode: config.mode || this.config.mode
		};

		// Track progress for upload
		if (config.onProgress && config.body) {
			this.trackUploadProgress(config.body, config.onProgress);
		}

		let fetchResponse: Response;

		try {
			fetchResponse = await fetch(url, init);
		} catch (error: any) {
			if (error.name === 'AbortError') {
				throw new AbortError('Request aborted', config);
			}
			throw new NetworkError(error.message || 'Network error', config);
		}

		// Handle 304 Not Modified
		if (fetchResponse.status === 304 && method === 'GET') {
			const cacheKey = this.cache.generateKey(method, url);
			const cachedEntry = this.cache.get<T>(cacheKey);

			if (cachedEntry) {
				return {
					data: cachedEntry.data,
					status: 304,
					statusText: 'Not Modified',
					headers: fetchResponse.headers,
					config,
					timing: {
						start: startTime,
						end: performance.now(),
						duration: performance.now() - startTime
					}
				};
			}
		}

		// Parse response
		const data = await this.parseResponse<T>(fetchResponse, config.onProgress);

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

		// Handle HTTP errors
		if (!fetchResponse.ok) {
			throw new HTTPError(
				`HTTP Error: ${fetchResponse.status} ${fetchResponse.statusText}`,
				response,
				config
			);
		}

		return response;
	}

	/**
	 * Parse response body with progress tracking
	 */
	private async parseResponse<T>(response: Response, onProgress?: (progress: ProgressEvent) => void): Promise<T> {
		const contentType = response.headers.get('content-type') || '';
		const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

		// Track download progress if callback provided
		if (onProgress && response.body && contentLength > 0) {
			const reader = response.body.getReader();
			let loaded = 0;
			const chunks: Uint8Array[] = [];

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				chunks.push(value);
				loaded += value.length;

				onProgress({
					loaded,
					total: contentLength,
					percentage: (loaded / contentLength) * 100,
					phase: 'download'
				});
			}

			// Reconstruct response
			const blob = new Blob(chunks as BlobPart[]);

			if (contentType.includes('application/json')) {
				const text = await blob.text();
				return JSON.parse(text);
			}

			return blob as any;
		}

		// Parse based on content type
		if (contentType.includes('application/json')) {
			return await response.json();
		}

		if (contentType.includes('text/')) {
			return await response.text() as any;
		}

		if (contentType.includes('application/octet-stream') || contentType.includes('image/')) {
			return await response.blob() as any;
		}

		// Default to text
		return await response.text() as any;
	}

	/**
	 * Cache response
	 */
	private cacheResponse<T>(url: string, method: HttpMethod, config: RequestConfig, response: HttpResponse<T>): void {
		const cacheStrategy = config.cache || this.config.cache!;
		const cacheKey = this.cache.generateKey(method, url);
		const ttl = config.cacheTTL || cacheStrategy.ttl || 300000; // Default 5 minutes
		const storage = cacheStrategy.storage || 'memory';
		const etag = response.headers.get('etag') || undefined;

		const headers: Record<string, string> = {};
		response.headers.forEach((value, key) => {
			headers[key] = value;
		});

		this.cache.set(cacheKey, response.data, ttl, storage, etag, headers);
	}

	/**
	 * Track upload progress (best effort for FormData and Blob)
	 */
	private trackUploadProgress(body: BodyInit, onProgress: (progress: ProgressEvent) => void): void {
		// Note: Upload progress tracking with fetch() is limited
		// This is a simplified implementation
		let size = 0;

		if (body instanceof Blob) {
			size = body.size;
		} else if (body instanceof ArrayBuffer) {
			size = body.byteLength;
		} else if (typeof body === 'string') {
			size = new Blob([body]).size;
		}

		if (size > 0) {
			// Simulate progress (fetch doesn't support real upload progress)
			onProgress({
				loaded: size,
				total: size,
				percentage: 100,
				phase: 'upload'
			});
		}
	}

	/**
	 * Setup request timeout
	 */
	private setupTimeout(abortController: AbortController, timeout: number): number {
		return setTimeout(() => {
			abortController.abort(new TimeoutError(timeout, {} as RequestConfig));
		}, timeout) as unknown as number;
	}

	/**
	 * Determine if request should be retried
	 */
	private shouldRetry(error: Error, status: number | undefined, retryConfig: RetryConfig, attempt: number): boolean {
		// Custom retry function
		if (retryConfig.shouldRetry) {
			return retryConfig.shouldRetry(error, attempt);
		}

		// Retry on specific status codes
		if (status && retryConfig.retryOn) {
			return retryConfig.retryOn.includes(status);
		}

		// Default: retry on network errors and 5xx errors
		if (error instanceof NetworkError) {
			return true;
		}

		if (error instanceof HTTPError && status && status >= 500) {
			return true;
		}

		return false;
	}

	/**
	 * Calculate retry delay
	 */
	private calculateRetryDelay(attempt: number, retryConfig: RetryConfig): number {
		const baseDelay = retryConfig.delay || 1000;

		if (retryConfig.backoff === 'exponential') {
			return baseDelay * Math.pow(2, attempt - 1);
		}

		return baseDelay * attempt;
	}

	/**
	 * Delay helper
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Build full URL with query params
	 */
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

	/**
	 * Build headers
	 */
	private buildHeaders(headers?: Record<string, string>): HeadersInit {
		return {
			...this.config.headers,
			...headers
		};
	}

	/**
	 * Prepare request body
	 */
	private prepareBody(body?: any): BodyInit | null {
		if (!body) return null;

		if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || body instanceof URLSearchParams) {
			return body;
		}

		if (typeof body === 'object') {
			return JSON.stringify(body);
		}

		return body;
	}

	/**
	 * Merge config with defaults
	 */
	private mergeConfig(config: RequestConfig & { url?: string }): RequestConfig & { url?: string } {
		return {
			...this.config,
			...config,
			headers: {
				...this.config.headers,
				...config.headers
			}
		};
	}

	/**
	 * Clear all cache
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Cancel all pending requests
	 */
	cancelAll(reason?: string): void {
		this.requestManager.cancelAllRequests(reason);
	}
}
