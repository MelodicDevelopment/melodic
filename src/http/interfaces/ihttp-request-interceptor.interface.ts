import type { IRequestConfig } from './irequest-config.interface';

export interface IHttpRequestInterceptor {
	intercept(response: IRequestConfig): Promise<IRequestConfig>;
	error?(error: Error): Promise<unknown>;
}
