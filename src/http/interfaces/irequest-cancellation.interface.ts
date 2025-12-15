import type { IHttpResponse } from './ihttp-response.interface';

export interface IRequestCancellation {
	cancelled: boolean;
	cancelledResponse?: IHttpResponse<unknown>;
	cancelReason?: string;
}
