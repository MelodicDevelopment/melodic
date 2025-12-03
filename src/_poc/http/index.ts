/**
 * HTTP Client - Public API
 */

export { HttpClient } from './http-client';
export { HttpCache } from './cache';
export { InterceptorManager } from './interceptor';
export { RequestManager } from './request-manager';

export {
	HttpError,
	NetworkError,
	TimeoutError,
	AbortError,
	HTTPError
} from './errors';

export type {
	HttpMethod,
	RequestConfig,
	CacheStrategy,
	RetryConfig,
	ProgressEvent,
	HttpResponse,
	ResponseTiming,
	RequestInterceptor,
	ResponseInterceptor,
	CacheEntry,
	HttpClientConfig
} from './types';
