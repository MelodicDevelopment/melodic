import type { IHttpResponse } from './ihttp-response.interface';

export interface IRequestCancellation {
	cancelled: boolean;
	cancelledResponse?: IHttpResponse<unknown>;
	/** Informational only — for your own interceptors and logging. The client does not read it. */
	cancelReason?: string;
}
