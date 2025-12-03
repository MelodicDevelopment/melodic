/**
 * HTTP Client Types
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface RequestConfig {
	url?: string;
	method?: HttpMethod;
	headers?: Record<string, string>;
	body?: BodyInit | null;
	params?: Record<string, string | number | boolean>;
	timeout?: number;
	cache?: CacheStrategy;
	cacheTTL?: number;
	retry?: RetryConfig;
	onProgress?: (progress: ProgressEvent) => void;
	signal?: AbortSignal;
	credentials?: RequestCredentials;
	mode?: RequestMode;
	deduplicate?: boolean;
}

export interface CacheStrategy {
	enabled: boolean;
	ttl?: number;
	storage?: 'memory' | 'localStorage';
	key?: string;
	bustCache?: boolean;
}

export interface RetryConfig {
	maxAttempts?: number;
	delay?: number;
	backoff?: 'linear' | 'exponential';
	retryOn?: number[];
	shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface ProgressEvent {
	loaded: number;
	total: number;
	percentage: number;
	phase: 'upload' | 'download';
}

export interface HttpResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: Headers;
	config: RequestConfig;
	timing?: ResponseTiming;
}

export interface ResponseTiming {
	start: number;
	end: number;
	duration: number;
}

export interface RequestInterceptor {
	onFulfilled?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
	onRejected?: (error: Error) => any;
}

export interface ResponseInterceptor {
	onFulfilled?: <T = any>(response: HttpResponse<T>) => HttpResponse<T> | Promise<HttpResponse<T>>;
	onRejected?: (error: Error) => any;
}

export interface CacheEntry<T = any> {
	data: T;
	timestamp: number;
	ttl: number;
	etag?: string;
	headers: Record<string, string>;
}

export interface HttpClientConfig {
	baseURL?: string;
	timeout?: number;
	headers?: Record<string, string>;
	cache?: CacheStrategy;
	retry?: RetryConfig;
	credentials?: RequestCredentials;
	mode?: RequestMode;
}
