import type { HttpMethod } from '../types/http-method.type';
import type { HttpRequestBody } from '../types/http-request-body.type';
import type { IProgressEvent } from './iprogress-event.interface';
import type { IRequestCancellation } from './irequest-cancellation.interface';

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
	deduplicate?: boolean;
	onProgress?: (progress: IProgressEvent) => void;
	abortController?: AbortController;
	credentials?: RequestCredentials;
	mode?: RequestMode;
	cancel?: IRequestCancellation;
}
