import type { IHttpResponse } from './ihttp-response.interface';

export interface IHttpResponseErrorContext<T = any> {
	/**
	 * Re-issues the original request. One-shot per error handler invocation —
	 * calling twice throws. Throws once the retry limit is reached.
	 */
	retry: () => Promise<IHttpResponse<T>>;
	/** Number of retries already attempted for this request (0 on first failure). */
	retryCount: number;
}

export interface IHttpResponseInterceptor {
	intercept<T>(response: IHttpResponse<T>): Promise<IHttpResponse<T>>;
	/**
	 * Called when the underlying request fails (non-2xx, network, abort) or when
	 * a prior `intercept()` throws. Return an `IHttpResponse` to recover — the
	 * remaining response interceptors will run on it. Reject (or resolve void)
	 * to defer to the next interceptor's `error()`. If none recover, the
	 * original error is rethrown to the caller.
	 */
	error?<T = any>(error: Error, context: IHttpResponseErrorContext<T>): Promise<IHttpResponse<T> | void>;
}
