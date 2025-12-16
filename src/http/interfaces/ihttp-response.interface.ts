import type { IRequestConfig } from './irequest-config.interface';

export interface IHttpResponse<T = any> {
	data: T;
	status: number;
	statusText: string;
	headers: Headers;
	config: IRequestConfig;
}
