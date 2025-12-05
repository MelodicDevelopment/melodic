import type { IHttpClientConfig } from './interfaces/ihttp-client-config.interface';
import type { IHttpRequestInterceptor } from './interfaces/ihttp-request-interceptor.interface';
import type { IHttpResponseInterceptor } from './interfaces/ihttp-response-interceptor.interface';
import type { IRequestConfig } from './interfaces/irequest-config.interface';

export class HttpClient {
	private _interceptors: {
		request: IHttpRequestInterceptor[];
		response: IHttpResponseInterceptor[];
	} = {
		request: [],
		response: []
	};

	public get interceptors() {
		return {
			request: (interceptor: IHttpRequestInterceptor): void => {
				this._interceptors.request.push(interceptor);
			},
			response: (interceptor: IHttpResponseInterceptor): void => {
				this._interceptors.response.push(interceptor);
			}
		};
	}

	constructor(private _clientConfig: IHttpClientConfig) {
		this._clientConfig = {
			headers: {},
			..._clientConfig
		};
	}

	public async get<T>(url: string, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'GET', ...config, url });
	}

	public async post<T>(url: string, body?: any, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'POST', ...config, url, body });
	}

	private async internalRequest<T>(config: IRequestConfig): Promise<T> {
		return this.executeRequest<T>();
	}

	private async executeRequest<T>(): Promise<T> {
		return await Promise.resolve({} as T);
	}
}
