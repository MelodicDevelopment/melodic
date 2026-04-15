import { AbortError, HttpError, NetworkError } from './http-error.class';
import type { IHttpClientConfig } from '../interfaces/ihttp-client-config.interface';
import type { IHttpRequestInterceptor } from '../interfaces/ihttp-request-interceptor.interface';
import type {
	IHttpResponseErrorContext,
	IHttpResponseInterceptor
} from '../interfaces/ihttp-response-interceptor.interface';
import type { IHttpResponse } from '../interfaces/ihttp-response.interface';
import type { IInterceptorApi } from '../interfaces/iinterceptor-api.interface';
import type { IProgressEvent } from '../interfaces/iprogress-event.interface';
import type { IRequestConfig } from '../interfaces/irequest-config.interface';
import type { HttpRequestBody } from '../types/http-request-body.type';
import { RequestManager } from './request-manager.class';

const MAX_RETRIES = 3;

export class HttpClient {
	private _clientConfig: IHttpClientConfig;
	private _requestManager = new RequestManager();
	private _interceptors: {
		request: IHttpRequestInterceptor[];
		response: IHttpResponseInterceptor[];
	} = {
		request: [],
		response: []
	};

	public interceptors: IInterceptorApi = {
		request: (interceptor: IHttpRequestInterceptor): void => {
			this._interceptors.request.push(interceptor);
		},
		response: (interceptor: IHttpResponseInterceptor): void => {
			this._interceptors.response.push(interceptor);
		}
	};

	constructor(config?: IHttpClientConfig) {
		this._clientConfig = {
			defaultHeaders: {},
			...config
		};
	}

	public async get<T>(url: string, config?: IRequestConfig): Promise<IHttpResponse<T>> {
		return this.internalRequest<T>({ method: 'GET', ...config, url, deduplicate: config?.deduplicate ?? true });
	}

	public async post<T>(url: string, body?: HttpRequestBody, config?: IRequestConfig): Promise<IHttpResponse<T>> {
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
		const originalConfig: IRequestConfig = config;
		let requestConfig: IRequestConfig = this.mergeConfig(config);
		requestConfig = await this.executeRequestInterceptors(requestConfig);

		if (requestConfig.cancel?.cancelled) {
			if (requestConfig.cancel.cancelReason) {
				console.log('[HttpClient] Request cancelled:', requestConfig.cancel.cancelReason);
			}

			let cancelledResponse: IHttpResponse<T> = {
				data: null as any,
				status: 0,
				statusText: 'Request Cancelled',
				headers: new Headers(),
				config: requestConfig
			};

			if (requestConfig.cancel.cancelledResponse) {
				cancelledResponse = { ...cancelledResponse, ...(requestConfig.cancel.cancelledResponse as IHttpResponse<T>) };
			}

			return Promise.resolve(cancelledResponse);
		}

		if (requestConfig.body instanceof FormData) {
			const headers = { ...requestConfig.headers } as Record<string, string>;
			delete headers['Content-Type'];
			delete headers['content-type'];
			requestConfig.headers = headers;
		} else if (this.shouldDefaultJsonContentType(requestConfig.body)) {
			const headers = { ...requestConfig.headers } as Record<string, string>;
			const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === 'content-type');

			if (!hasContentType) {
				headers['Content-Type'] = 'application/json';
				requestConfig.headers = headers;
			}
		}

		if (requestConfig.abortController === undefined) {
			const abortController = new AbortController();
			requestConfig.abortController = abortController;
		}

		try {
			const response = await this.executeRequest<T>(requestConfig);

			return await this.executeResponseInterceptors<T>(response, 0);
		} catch (error) {
			return this.handleResponseError<T>(error as Error, originalConfig);
		}
	}

	private async handleResponseError<T>(error: Error, originalConfig: IRequestConfig): Promise<IHttpResponse<T>> {
		const retryCount = originalConfig._retryCount ?? 0;

		for (let i = 0; i < this._interceptors.response.length; i++) {
			const interceptor = this._interceptors.response[i];

			if (!interceptor.error) {
				continue;
			}

			let retryCalled = false;
			const retry = async (): Promise<IHttpResponse<T>> => {
				if (retryCalled) {
					throw new Error('[HttpClient] retry() may only be called once per error handler invocation');
				}

				retryCalled = true;

				if (retryCount >= MAX_RETRIES) {
					throw new Error(`[HttpClient] Max retries (${MAX_RETRIES}) exceeded`);
				}

				return this.internalRequest<T>({
					...originalConfig,
					_retryCount: retryCount + 1,
					abortController: undefined
				});
			};

			const context: IHttpResponseErrorContext<T> = { retry, retryCount };

			try {
				const result = await interceptor.error(error, context);

				if (this.isHttpResponse<T>(result)) {
					return this.executeResponseInterceptors<T>(result, i + 1);
				}
			} catch {
				// Fall through to the next interceptor's error handler.
			}
		}

		throw error;
	}

	private isHttpResponse<T>(value: unknown): value is IHttpResponse<T> {
		return (
			!!value &&
			typeof value === 'object' &&
			'data' in value &&
			'status' in value &&
			'headers' in value &&
			'config' in value
		);
	}

	private shouldDefaultJsonContentType(body: HttpRequestBody | undefined): boolean {
		if (body === null || body === undefined) {
			return false;
		}

		if (typeof body === 'string') {
			return false;
		}

		if (
			body instanceof FormData ||
			body instanceof Blob ||
			body instanceof ArrayBuffer ||
			body instanceof URLSearchParams ||
			body instanceof ReadableStream
		) {
			return false;
		}

		return typeof body === 'object';
	}

	private async executeRequest<T>(config: IRequestConfig): Promise<IHttpResponse<T>> {
		if (config.deduplicate === true) {
			const requestKey = this._requestManager.generateRequestKey(config.method!, config.url!, config.body);

			if (this._requestManager.hasPendingRequest(requestKey)) {
				return this._requestManager.getPendingRequest<T>(requestKey)!;
			}
		}

		const fetchPromise = fetch(config.url!, {
			method: config.method,
			headers: config.headers,
			body: this.prepareBody(config.body),
			credentials: config.credentials,
			mode: config.mode,
			signal: config.abortController?.signal
		})
			.then(async (response) => {
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
			})
			.catch((error) => {
				if (error instanceof HttpError) {
					throw error;
				}
				if (error instanceof Error && error.name === 'AbortError') {
					throw new AbortError('Request aborted', config);
				}
				const message = error instanceof Error ? error.message : 'Network error';
				throw new NetworkError(message || 'Network error', config);
			});

		if (config.deduplicate === true) {
			this._requestManager.addPendingRequest<T>(config, fetchPromise);
		}

		return await fetchPromise;
	}

	private async executeRequestInterceptors(config: IRequestConfig): Promise<IRequestConfig> {
		for (const interceptor of this._interceptors.request) {
			try {
				config = await interceptor.intercept(config);

				if (config.cancel?.cancelled) {
					break;
				}
			} catch (error) {
				if (interceptor.error) {
					await interceptor.error(error as Error);
				}
				throw error;
			}
		}

		return config;
	}

	private async executeResponseInterceptors<T>(response: IHttpResponse<T>, startIndex: number): Promise<IHttpResponse<T>> {
		for (let i = startIndex; i < this._interceptors.response.length; i++) {
			response = await this._interceptors.response[i].intercept(response);
		}

		return response;
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
			fullUrl += `${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
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
					percentage: (loaded / contentLength) * 100
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
