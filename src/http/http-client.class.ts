import { AbortError, HttpError, NetworkError } from './http-error.class';
import type { IHttpClientConfig } from './interfaces/ihttp-client-config.interface';
import type { IHttpRequestInterceptor } from './interfaces/ihttp-request-interceptor.interface';
import type { IHttpResponseInterceptor } from './interfaces/ihttp-response-interceptor.interface';
import type { IHttpResponse } from './interfaces/ihttp-response.interface';
import type { IProgressEvent } from './interfaces/iprogress-event.interface';
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

	public async get<T>(url: string, config?: IRequestConfig): Promise<IHttpResponse<T>> {
		return this.internalRequest<T>({ method: 'GET', ...config, url });
	}

	public async post<T>(url: string, body?: any, config?: IRequestConfig): Promise<IHttpResponse<T>> {
		return this.internalRequest<T>({ method: 'POST', ...config, url, body });
	}

	public async put<T>(url: string, body?: HttpRequestBody, config?: IRequestConfig): Promise<IHttpResponse<T>> {
		return this.internalRequest<T>({ method: 'PUT', ...config, url, body });
	}

	public async patch<T>(url: string, body?: HttpRequestBody, config?: IRequestConfig): Promise<IHttpResponse<T>> {
		return this.internalRequest<T>({ method: 'PATCH', ...config, url, body });
	}

	public async delete<T>(url: string, config?: IRequestConfig): Promise<IHttpResponse<T>> {
		return this.internalRequest<T>({ method: 'DELETE', ...config, url });
	}

	private async internalRequest<T>(config: IRequestConfig): Promise<IHttpResponse<T>> {
		let requestConfig: IRequestConfig = this.mergeConfig(config);

		for (const interceptor of this._interceptors.request) {
			requestConfig = await interceptor.intercept(requestConfig);
		}

		let response = await this.executeRequest<T>(requestConfig);

		for (const interceptor of this._interceptors.response) {
			response = await interceptor.intercept(response);
		}

		return response;
	}

	private async executeRequest<T>(config: IRequestConfig): Promise<IHttpResponse<T>> {
		let response: Response;

		try {
			response = await fetch(config.url!, {
				method: config.method,
				headers: config.headers,
				body: this.prepareBody(config.body),
				credentials: config.credentials,
				mode: config.mode,
				signal: config.abortSignal
			});
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new AbortError('Request aborted', config);
			}
			const message = error instanceof Error ? error.message : 'Network error';
			throw new NetworkError(message || 'Network error', config);
		}

		const data = await this.parseResponse<T>(response, config.onProgress);

		const httpResponse: IHttpResponse<T> = {
			data,
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
			config
		};

		if (!response.ok) {
			throw new HttpError(`HTTP Error: ${response.status} ${response.statusText}`, httpResponse, config);
		}

		return httpResponse;
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

	private prepareBody(body?: HttpRequestBody): BodyInit | null {
		if (body === null || body === undefined) {
			return null;
		}

		if (
			body instanceof FormData ||
			body instanceof Blob ||
			body instanceof ArrayBuffer ||
			body instanceof URLSearchParams ||
			body instanceof ReadableStream ||
			typeof body === 'string'
		) {
			return body as BodyInit;
		}

		// Plain object - convert to JSON
		return JSON.stringify(body);
	}

	private async parseResponse<T>(response: Response, onProgress?: (progress: IProgressEvent) => void): Promise<T> {
		const contentType = response.headers.get('content-type') || '';
		const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

		if (onProgress && response.body && contentLength > 0) {
			const reader = response.body.getReader();
			let loaded = 0;
			const chunks: Uint8Array[] = [];

			while (true) {
				const { done, value } = await reader.read();

				if (done) break;

				chunks.push(value);
				loaded += value.length;

				onProgress({
					loaded,
					total: contentLength,
					percentage: (loaded / contentLength) * 100,
					phase: 'download'
				});
			}

			const blob = new Blob(chunks as BlobPart[]);

			if (contentType.includes('application/json')) {
				const text = await blob.text();
				return JSON.parse(text);
			}

			return blob as T;
		}

		if (contentType.includes('application/json')) {
			return (await response.json()) as T;
		}

		if (contentType.includes('text/')) {
			return (await response.text()) as T;
		}

		if (contentType.includes('application/octet-stream') || contentType.includes('image/')) {
			return (await response.blob()) as T;
		}

		return (await response.text()) as T;
	}
}
