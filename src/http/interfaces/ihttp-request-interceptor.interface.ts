import type { IRequestConfig } from './irequest-config.interface';

export interface IHttpRequestInterceptor {
	intercept(request: IRequestConfig): Promise<IRequestConfig>;
	error?(error: Error): Promise<unknown>;
}
