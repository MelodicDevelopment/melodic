import type { IHttpResponse } from './ihttp-response.interface';

export interface IHttpResponseInterceptor {
	intercept<T>(response: IHttpResponse<T>): Promise<IHttpResponse<T>>;
	error?(error: Error): Promise<unknown>;
}
