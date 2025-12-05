import type { IHttpClientConfig } from './interfaces/ihttp-client-config.interface';
import type { IHttpRequestInterceptor } from './interfaces/ihttp-request-interceptor.interface';
import type { IHttpResponseInterceptor } from './interfaces/ihttp-response-interceptor.interface';
import type { IRequestConfig } from './interfaces/irequest-config.interface';
import type { HttpRequestBody } from './types/http-request-body.type';

export class HttpClient {
	private _clientConfig: IHttpClientConfig;
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

	constructor(config: IHttpClientConfig) {
		this._clientConfig = {
			defaultHeaders: {},
			...config
		};
	}

	public async get<T>(url: string, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'GET', ...config, url });
	}

	public async post<T>(url: string, body?: any, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'POST', ...config, url, body });
	}

	public async put<T>(url: string, body?: HttpRequestBody, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'PUT', ...config, url, body });
	}

	public async patch<T>(url: string, body?: HttpRequestBody, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'PATCH', ...config, url, body });
	}

	public async delete<T>(url: string, config?: IRequestConfig): Promise<T> {
		return this.internalRequest<T>({ method: 'DELETE', ...config, url });
	}

	private async internalRequest<T>(config: IRequestConfig): Promise<T> {
		let requestConfig: IRequestConfig = this.mergeConfig(config);

		for (const interceptor of this._interceptors.request) {
			requestConfig = await interceptor.intercept(requestConfig);
		}

		return this.executeRequest<T>();
	}

	private async executeRequest<T>(): Promise<T> {
		return await Promise.resolve({} as T);
	}

	private mergeConfig(config: IRequestConfig): IRequestConfig {
		return {
			...this._clientConfig,
			...config,
			headers: {
				...this._clientConfig.defaultHeaders,
				...config.headers
			},
			url: this.buildUrl(config.url ?? '', config.params)
		};
	}

	private buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
		const baseUrl: string = this._clientConfig.baseURL || '';
		let fullUrl = `${baseUrl}${url}`;

		if (params) {
			const queryString = Object.entries(params)
				.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
				.join('&');
			fullUrl += `?${queryString}`;
		}

		return fullUrl;
	}
}
