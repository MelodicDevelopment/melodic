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
import type { HttpResponseType, IRequestConfig } from '../interfaces/irequest-config.interface';
import type { HttpRequestBody } from '../types/http-request-body.type';
import { RequestManager } from './request-manager.class';

const MAX_RETRIES = 3;

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:\/\//i;

/** `application/json`, `application/problem+json`, `application/vnd.api+json`, `text/json`, … */
const JSON_CONTENT_TYPE_PATTERN = /[/+]json\b/i;

/**
 * Combines abort signals into one that aborts when ANY of them aborts.
 * Uses the native `AbortSignal.any` where available.
 */
function combineSignals(signals: AbortSignal[]): AbortSignal | undefined {
	if (signals.length === 0) {
		return undefined;
	}

	if (signals.length === 1) {
		return signals[0];
	}

	if (typeof AbortSignal.any === 'function') {
		return AbortSignal.any(signals);
	}

	const controller = new AbortController();
	for (const signal of signals) {
		if (signal.aborted) {
			controller.abort(signal.reason);
			break;
		}
		signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
	}

	return controller.signal;
}

/** A signal that aborts with a TimeoutError after `ms` milliseconds. */
function createTimeoutSignal(ms: number): AbortSignal {
	if (typeof AbortSignal.timeout === 'function') {
		return AbortSignal.timeout(ms);
	}

	const controller = new AbortController();
	setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), ms);
	return controller.signal;
}

export class HttpClient {
	private _clientConfig: IHttpClientConfig;
	private _requestManager = new RequestManager();
	/**
	 * Errors the response error-interceptor chain has already processed (inside
	 * a shared, deduplicated request). Each participant rethrows them as-is
	 * rather than running the chain again.
	 */
	private _handledErrors = new WeakSet<object>();
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

		// Compose the caller-side abort signal: explicit `signal`, legacy
		// `abortController`, and the per-request timeout (AbortSignal.timeout).
		const callerSignals: AbortSignal[] = [];
		if (requestConfig.signal) {
			callerSignals.push(requestConfig.signal);
		}
		if (requestConfig.abortController) {
			callerSignals.push(requestConfig.abortController.signal);
		}
		if (requestConfig.timeout && requestConfig.timeout > 0) {
			callerSignals.push(createTimeoutSignal(requestConfig.timeout));
		}
		const callerSignal = combineSignals(callerSignals);

		try {
			if (requestConfig.deduplicate === true) {
				return await this.executeDeduplicatedRequest<T>(requestConfig, originalConfig, callerSignal);
			}

			const response = await this.executeRequest<T>(requestConfig, callerSignal);

			return await this.executeResponseInterceptors<T>(response, 0);
		} catch (error) {
			if (typeof error === 'object' && error !== null && this._handledErrors.has(error)) {
				throw error;
			}

			return this.handleResponseError<T>(error as Error, originalConfig);
		}
	}

	/**
	 * Deduplicated execution: one underlying fetch per request key, response
	 * interceptors run EXACTLY ONCE on the shared response, and cancellation is
	 * ref-counted — the underlying request aborts only when every participant
	 * has aborted, while each aborting caller's own promise rejects immediately.
	 *
	 * A failure of the shared request runs the response ERROR interceptors
	 * exactly once as well, inside the shared promise: N callers sharing one
	 * 401 must trigger one token refresh and one retry, not N. A caller's own
	 * abort is not a failure of the shared request and is still reported to
	 * the error interceptors for that caller alone.
	 */
	private async executeDeduplicatedRequest<T>(config: IRequestConfig, originalConfig: IRequestConfig, callerSignal?: AbortSignal): Promise<IHttpResponse<T>> {
		const requestKey = this._requestManager.generateRequestKey({
			method: config.method!,
			url: config.url!,
			params: config.params,
			headers: config.headers,
			credentials: config.credentials,
			mode: config.mode,
			body: config.body,
			responseType: config.responseType
		});

		let shared = this._requestManager.joinPendingRequest<T>(requestKey, callerSignal);

		if (!shared) {
			const sharedController = new AbortController();
			// A retry issued by an error interceptor belongs to every
			// participant, so it must live and die with the shared request —
			// not with the signal or timeout of whichever caller came first.
			// It is also not deduplicated itself: the shared request is still
			// registered while its error handlers run, so a deduplicated retry
			// would join the very promise that is waiting for it.
			const sharedConfig: IRequestConfig = {
				...originalConfig,
				signal: sharedController.signal,
				abortController: undefined,
				deduplicate: false
			};
			const promise = this.executeRequest<T>(config, sharedController.signal)
				.then((response) => this.executeResponseInterceptors<T>(response, 0))
				.catch((error) => {
					// Every participant left: nobody is waiting for a recovery,
					// and each one already reported its own abort.
					if (sharedController.signal.aborted) {
						throw error;
					}
					return this.handleResponseError<T>(error as Error, sharedConfig);
				})
				.catch((error) => {
					if (typeof error === 'object' && error !== null) {
						this._handledErrors.add(error);
					}
					throw error;
				});
			shared = this._requestManager.addPendingRequest<T>(requestKey, promise, sharedController, callerSignal);
		}

		return this.raceCallerAbort<T>(shared, callerSignal, config);
	}

	/**
	 * Settles with the shared response unless this specific caller's signal
	 * aborts first, in which case the caller gets an AbortError while the
	 * shared request keeps running for the remaining participants.
	 */
	private raceCallerAbort<T>(promise: Promise<IHttpResponse<T>>, signal: AbortSignal | undefined, config: IRequestConfig): Promise<IHttpResponse<T>> {
		if (!signal) {
			return promise;
		}

		const toAbortError = (): AbortError => {
			const timedOut = signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError';
			return new AbortError(timedOut ? 'Request timed out' : 'Request aborted', config);
		};

		if (signal.aborted) {
			return Promise.reject(toAbortError());
		}

		return new Promise<IHttpResponse<T>>((resolve, reject) => {
			const onAbort = (): void => reject(toAbortError());
			signal.addEventListener('abort', onAbort, { once: true });

			promise.then(
				(value) => {
					signal.removeEventListener('abort', onAbort);
					resolve(value);
				},
				(error) => {
					signal.removeEventListener('abort', onAbort);
					reject(error);
				}
			);
		});
	}

	private async handleResponseError<T>(error: Error, originalConfig: IRequestConfig): Promise<IHttpResponse<T>> {
		const retryCount = originalConfig._retryCount ?? 0;
		// One retry per error pass, across ALL interceptors — otherwise N error
		// handlers could each fan out a retry at the same depth.
		let retryInitiated = false;
		// Errors thrown by error handlers replace the propagated error, so
		// "catch HttpError, throw domain error" reaches the caller instead of
		// being silently swallowed.
		let currentError = error;

		for (let i = 0; i < this._interceptors.response.length; i++) {
			const interceptor = this._interceptors.response[i];

			if (!interceptor.error) {
				continue;
			}

			const retry = async (): Promise<IHttpResponse<T>> => {
				if (retryInitiated) {
					throw new Error('[HttpClient] retry() may only be called once per error pass');
				}

				retryInitiated = true;

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
				const result = await interceptor.error(currentError, context);

				if (this.isHttpResponse<T>(result)) {
					// A response obtained via retry() already ran the FULL response
					// interceptor chain inside internalRequest — running [i+1..n]
					// again would apply data-unwrap/logging interceptors twice.
					return retryInitiated ? result : this.executeResponseInterceptors<T>(result, i + 1);
				}
			} catch (interceptorError) {
				// The handler threw (or its retry() failed): propagate this error to
				// the remaining handlers and rethrow it if none of them recover.
				currentError = interceptorError as Error;
			}

			// A retry was initiated but didn't yield a response we returned above
			// (e.g. it threw). Stop — don't let later handlers retry again.
			if (retryInitiated) {
				break;
			}
		}

		throw currentError;
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
			ArrayBuffer.isView(body) ||
			body instanceof URLSearchParams ||
			body instanceof ReadableStream
		) {
			return false;
		}

		return typeof body === 'object';
	}

	private async executeRequest<T>(config: IRequestConfig, signal?: AbortSignal): Promise<IHttpResponse<T>> {
		return fetch(config.url!, {
			method: config.method,
			headers: config.headers,
			body: this.prepareBody(config.body),
			credentials: config.credentials,
			mode: config.mode,
			signal
		})
			.then(async (response) => {
				const data = await this.parseResponse<T>(response, config.onProgress, config.responseType);

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
				// A signal aborted via AbortSignal.timeout carries a TimeoutError
				// DOMException as reason; fetch rejects with it directly.
				if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
					throw new AbortError(error.name === 'TimeoutError' ? 'Request timed out' : 'Request aborted', config);
				}
				const message = error instanceof Error ? error.message : 'Network error';
				throw new NetworkError(message || 'Network error', config);
			});
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
		const url = this.buildUrl(config.url ?? '', config.params);

		if (!this.shouldSendDefaultsTo(url)) {
			// Another origin: the client's default headers (typically
			// `Authorization`) and credentials mode were configured for the
			// app's own API and must not be handed to a third party. Whatever
			// the request itself asks for is still honored.
			const { defaultHeaders, credentials, ...clientConfig } = this._clientConfig;
			void defaultHeaders;
			void credentials;

			return {
				...clientConfig,
				...config,
				headers: { ...config.headers },
				url
			};
		}

		return {
			...this._clientConfig,
			...config,
			headers: {
				...this._clientConfig.defaultHeaders,
				...config.headers
			},
			url
		};
	}

	/**
	 * Whether the client-level `defaultHeaders` and `credentials` apply to a
	 * request URL: always for the `baseURL`'s origin and the page's own origin,
	 * and for any other origin only when `allowCrossOriginDefaults` is set.
	 */
	private shouldSendDefaultsTo(url: string): boolean {
		if (this._clientConfig.allowCrossOriginDefaults) {
			return true;
		}

		const isAbsolute = ABSOLUTE_URL_PATTERN.test(url) || url.startsWith('//');
		const pageHref = typeof location !== 'undefined' && typeof location.href === 'string' ? location.href : undefined;

		if (!isAbsolute) {
			// Resolved by fetch against the page: same origin by construction.
			return true;
		}

		try {
			const target = new URL(url, pageHref).origin;
			const baseUrl = this._clientConfig.baseURL;

			if (baseUrl && (ABSOLUTE_URL_PATTERN.test(baseUrl) || baseUrl.startsWith('//')) && new URL(baseUrl, pageHref).origin === target) {
				return true;
			}

			return pageHref !== undefined && new URL(pageHref).origin === target;
		} catch {
			return false;
		}
	}

	private buildUrl(url: string, params?: IRequestConfig['params']): string {
		const baseUrl: string = this._clientConfig.baseURL || '';

		// Absolute URLs are used as-is; otherwise join base and path with exactly
		// one slash (no double slashes, no missing slash).
		let fullUrl: string;
		if (!baseUrl || ABSOLUTE_URL_PATTERN.test(url)) {
			fullUrl = url;
		} else {
			fullUrl = `${baseUrl.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
		}

		if (params) {
			const pairs: string[] = [];
			for (const [key, value] of Object.entries(params)) {
				if (value === null || value === undefined) {
					continue;
				}
				const values = Array.isArray(value) ? value : [value];
				for (const v of values) {
					if (v === null || v === undefined) {
						continue;
					}
					pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
				}
			}

			if (pairs.length > 0) {
				fullUrl += `${fullUrl.includes('?') ? '&' : '?'}${pairs.join('&')}`;
			}
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
			ArrayBuffer.isView(body) ||
			body instanceof URLSearchParams ||
			body instanceof ReadableStream ||
			typeof body === 'string'
		) {
			return body as BodyInit;
		}

		// Plain object - convert to JSON
		return JSON.stringify(body);
	}

	private async parseResponse<T>(response: Response, onProgress?: (progress: IProgressEvent) => void, responseType?: HttpResponseType): Promise<T> {
		const contentType = response.headers.get('content-type') || '';
		const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

		// An explicit `responseType` wins; otherwise the content-type decides.
		const kind: HttpResponseType =
			responseType ??
			(JSON_CONTENT_TYPE_PATTERN.test(contentType)
				? 'json'
				: contentType.includes('text/')
					? 'text'
					: this.isBinaryContentType(contentType)
						? 'blob'
						: 'text');

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

			// Decode exactly like the non-progress path below — supplying
			// onProgress must not change what the caller receives.
			const blob = new Blob(chunks as BlobPart[], contentType ? { type: contentType } : undefined);

			switch (kind) {
				case 'json':
					return this.parseJsonText<T>(await blob.text(), response);
				case 'blob':
					return blob as T;
				case 'arrayBuffer':
					return (await blob.arrayBuffer()) as T;
				default:
					return (await blob.text()) as T;
			}
		}

		switch (kind) {
			case 'json':
				return this.parseJsonText<T>(await response.text(), response);
			case 'blob':
				return (await response.blob()) as T;
			case 'arrayBuffer':
				return (await response.arrayBuffer()) as T;
			default:
				return (await response.text()) as T;
		}
	}

	/**
	 * Parse a body a JSON content-type promised.
	 *
	 * Empty bodies are common on 201/204/200 (POST/PUT/DELETE), and a failing
	 * gateway routinely returns an HTML error page under a JSON content-type.
	 * Neither may throw here: a parse error thrown from the response handler
	 * became a `NetworkError`, which erased the status code, so retry and auth
	 * interceptors keyed on `HttpError` never fired for a 502.
	 */
	private parseJsonText<T>(text: string, response: Response): T {
		if (!text) {
			return null as T;
		}

		try {
			return JSON.parse(text) as T;
		} catch {
			if (response.ok) {
				// A successful response that does not contain the JSON it
				// promised is worth surfacing; the raw text is still returned.
				console.warn(`[Melodic] [HttpClient] Response for ${response.url} declared JSON but did not parse; returning the raw text.`);
			}
			return text as unknown as T;
		}
	}

	private isBinaryContentType(contentType: string): boolean {
		return (
			contentType.includes('application/octet-stream') ||
			contentType.includes('application/pdf') ||
			contentType.includes('application/zip') ||
			contentType.startsWith('image/') ||
			contentType.startsWith('audio/') ||
			contentType.startsWith('video/') ||
			contentType.startsWith('font/')
		);
	}
}
