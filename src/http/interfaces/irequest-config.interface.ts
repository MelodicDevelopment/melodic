import type { HttpMethod } from '../types/http-method.type';
import type { HttpRequestBody } from '../types/http-request-body.type';

export interface IRequestConfig {
	url?: string;
	method?: HttpMethod;
	headers?: Record<string, string>;
	body?: HttpRequestBody;
	params?: Record<string, string | number | boolean>;
	//timeout?: number;
	//cache?: CacheStrategy;
	//cacheTTL?: number;
	//retry?: RetryConfig;
	onProgress?: (progress: ProgressEvent) => void;
	abortSignal?: AbortSignal;
	credentials?: RequestCredentials;
	mode?: RequestMode;
	// deduplicate?: boolean;
}
