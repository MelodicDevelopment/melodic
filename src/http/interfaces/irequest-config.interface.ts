import type { HttpMethod } from '../types/http-method.type';

export interface IRequestConfig {
	url?: string;
	method?: HttpMethod;
	headers?: Record<string, string>;
	body?: BodyInit | null;
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
