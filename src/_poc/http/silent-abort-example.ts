/**
 * Silent Request Cancellation (No Exception)
 *
 * Shows how to cancel requests in interceptors without throwing errors.
 * Requires modification to the HttpClient to check for cancellation flags.
 */

import type { RequestConfig, HttpResponse } from './types';

// ============================================
// Approach 1: Add cancellation flag to config
// ============================================

// Extend RequestConfig to include cancellation support
interface CancellableRequestConfig extends RequestConfig {
	_cancelled?: boolean;
	_cancelledResponse?: any; // Optional response to return when cancelled
	_cancelReason?: string;
}

/**
 * Modified interceptor pattern that sets a cancellation flag
 * instead of throwing an error
 */

// Example: Cancel if no auth token
function authInterceptor(config: CancellableRequestConfig): CancellableRequestConfig {
	const token = getAuthToken();

	if (!token) {
		// Set cancellation flag instead of throwing
		config._cancelled = true;
		config._cancelReason = 'No authentication token';
		config._cancelledResponse = {
			data: null,
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
}

// Example: Cancel if offline
function offlineInterceptor(config: CancellableRequestConfig): CancellableRequestConfig {
	if (!navigator.onLine) {
		config._cancelled = true;
		config._cancelReason = 'Device is offline';
		config._cancelledResponse = {
			data: { error: 'Offline' },
			status: 0,
			statusText: 'Offline',
			headers: new Headers(),
			config
		};
	}

	return config;
}

// Example: Cancel based on rate limiting
function rateLimitInterceptor(config: CancellableRequestConfig): CancellableRequestConfig {
	if (isRateLimited(config.url || '')) {
		config._cancelled = true;
		config._cancelReason = 'Rate limit exceeded';
		config._cancelledResponse = {
			data: { error: 'Rate limit exceeded', retryAfter: 60 },
			status: 429,
			statusText: 'Too Many Requests',
			headers: new Headers({ 'Retry-After': '60' }),
			config
		};
	}

	return config;
}

// ============================================
// Approach 2: Modify HttpClient to check flag
// ============================================

/**
 * This shows the modifications needed in http-client.ts
 * to support silent cancellation
 */

class HttpClientWithSilentCancel {
	// ... other methods ...

	private async request_internal<T = any>(config: CancellableRequestConfig & { url?: string }): Promise<HttpResponse<T>> {
		// Merge with default config
		const mergedConfig = this.mergeConfig(config) as CancellableRequestConfig;

		// Run request interceptors
		const interceptedConfig = await this.runRequestInterceptors(mergedConfig);

		// *** NEW: Check if request was cancelled ***
		if (interceptedConfig._cancelled) {
			// Return the provided response or a default one
			if (interceptedConfig._cancelledResponse) {
				return interceptedConfig._cancelledResponse as HttpResponse<T>;
			}

			// Return a default "cancelled" response
			return {
				data: null as T,
				status: 0,
				statusText: 'Cancelled',
				headers: new Headers(),
				config: interceptedConfig,
				timing: {
					start: 0,
					end: 0,
					duration: 0
				}
			};
		}

		// Continue with normal request flow...
		const fullUrl = this.buildUrl(interceptedConfig.url!, interceptedConfig.params);
		// ... rest of the method
	}

	private mergeConfig(config: any): any {
		// Implementation
		return config;
	}

	private buildUrl(url: string, params?: any): string {
		// Implementation
		return url;
	}

	private async runRequestInterceptors(config: any): Promise<any> {
		// Implementation
		return config;
	}
}

// ============================================
// Approach 3: Using AbortSignal (still clean)
// ============================================

/**
 * Use a pre-aborted signal - this is cleaner than throwing
 * and the client can check if signal is already aborted
 */

function createAbortedSignal(): AbortSignal {
	const controller = new AbortController();
	controller.abort();
	return controller.signal;
}

function silentAbortInterceptor(config: CancellableRequestConfig): CancellableRequestConfig {
	const token = getAuthToken();

	if (!token) {
		// Set an already-aborted signal
		config.signal = createAbortedSignal();
		config._cancelReason = 'No auth token';
		return config;
	}

	return config;
}

// Then in HttpClient, check before fetch:
function modifiedExecuteRequest<T>(config: CancellableRequestConfig): Promise<HttpResponse<T>> {
	// Check if signal is already aborted
	if (config.signal?.aborted) {
		// Return silently without throwing
		return Promise.resolve({
			data: null as T,
			status: 0,
			statusText: 'Cancelled',
			headers: new Headers(),
			config
		} as HttpResponse<T>);
	}

	// Continue with fetch...
	return {} as Promise<HttpResponse<T>>;
}

// ============================================
// Usage Examples
// ============================================

async function exampleUsage() {
	const config: CancellableRequestConfig = {
		url: '/api/data',
		method: 'GET'
	};

	// Run through interceptors
	let processedConfig = authInterceptor(config);
	processedConfig = offlineInterceptor(processedConfig);
	processedConfig = rateLimitInterceptor(processedConfig);

	// Check if cancelled
	if (processedConfig._cancelled) {
		console.log('Request cancelled:', processedConfig._cancelReason);

		// Use the cancelled response if available
		if (processedConfig._cancelledResponse) {
			const response = processedConfig._cancelledResponse;
			console.log('Returned response:', response);

			// No exception thrown - handle gracefully
			if (response.status === 401) {
				// Redirect to login
			} else if (response.status === 429) {
				// Show rate limit message
			}
		}

		return; // Exit gracefully
	}

	// Continue with request...
	console.log('Proceeding with request');
}

// ============================================
// Approach 4: Promise-based cancellation
// ============================================

/**
 * Return a resolved Promise from the interceptor
 * This requires more architectural changes
 */

interface InterceptorResult<T> {
	cancelled: boolean;
	config?: RequestConfig;
	response?: HttpResponse<T>;
}

async function promiseBasedInterceptor<T>(config: RequestConfig): Promise<InterceptorResult<T>> {
	const token = getAuthToken();

	if (!token) {
		// Return a resolved result indicating cancellation
		return {
			cancelled: true,
			response: {
				data: null as T,
				status: 401,
				statusText: 'Unauthorized',
				headers: new Headers(),
				config
			}
		};
	}

	return {
		cancelled: false,
		config: {
			...config,
			headers: {
				...config.headers,
				'Authorization': `Bearer ${token}`
			}
		}
	};
}

// ============================================
// Helpers
// ============================================

function getAuthToken(): string | null {
	return localStorage.getItem('auth_token');
}

function isRateLimited(url: string): boolean {
	// Rate limiting logic
	return false;
}

export {
	authInterceptor,
	offlineInterceptor,
	rateLimitInterceptor,
	silentAbortInterceptor,
	promiseBasedInterceptor,
	HttpClientWithSilentCancel
};

export type { CancellableRequestConfig, InterceptorResult };
