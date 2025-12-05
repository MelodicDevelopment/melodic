import type { IHttpRequestInterceptor } from './ihttp-request-interceptor.interface';
import type { IHttpResponseInterceptor } from './ihttp-response-interceptor.interface';

export interface IInterceptorApi {
	request: (interceptor: IHttpRequestInterceptor) => void;
	response: (interceptor: IHttpResponseInterceptor) => void;
}
