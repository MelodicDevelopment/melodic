import type { IRequestConfig } from '../interfaces';
import type { IHttpResponse } from '../interfaces/ihttp-response.interface';
import type { HttpRequestBody } from '../types/http-request-body.type';

interface IPendingRequest<T = any> {
	promise: Promise<IHttpResponse<T>>;
	abortController: AbortController;
}

export class RequestManager {
	private _pendingRequests = new Map<string, IPendingRequest>();
	private _opaqueCounter = 0;

	public generateRequestKey(method: string, url: string, body?: HttpRequestBody): string {
		let key = `${method}:${url}`;

		if (body) {
			key += `:${this.hashBody(body)}`;
		}

		return key;
	}

	public hasPendingRequest(key: string): boolean {
		return this._pendingRequests.has(key);
	}

	public getPendingRequest<T = any>(key: string): Promise<IHttpResponse<T>> | null {
		const pending = this._pendingRequests.get(key);

		if (!pending) {
			return null;
		}

		return pending.promise;
	}

	public addPendingRequest<T = any>(requestConfig: IRequestConfig, promise: Promise<IHttpResponse<T>>): void {
		const key = this.generateRequestKey(requestConfig.method || 'GET', requestConfig.url || '', requestConfig.body as BodyInit | null);

		this._pendingRequests.set(key, {
			promise,
			abortController: requestConfig.abortController!
		});

		promise.finally(() => {
			this.removePendingRequest(key);
		});
	}

	public cancelPendingRequest(key: string, reason?: string): void {
		const pending = this._pendingRequests.get(key);

		if (pending) {
			pending.abortController.abort(reason);
			this._pendingRequests.delete(key);
		}
	}

	public cancelAllRequests(reason?: string): void {
		this._pendingRequests.forEach((pending) => {
			pending.abortController.abort(reason);
		});

		this._pendingRequests.clear();
	}

	private removePendingRequest(key: string): void {
		const pending = this._pendingRequests.get(key);

		if (!pending) {
			return;
		}

		this._pendingRequests.delete(key);
	}

	private hashBody(body: HttpRequestBody): string {
		// Opaque bodies (FormData/Blob/ArrayBuffer/ReadableStream) can't be cheaply
		// compared, and merging two distinct uploads to the same URL would be a
		// correctness bug. Give each a unique key so they are never deduplicated.
		if (
			body instanceof FormData ||
			body instanceof Blob ||
			body instanceof ArrayBuffer ||
			body instanceof ReadableStream
		) {
			return `opaque:${++this._opaqueCounter}`;
		}

		let str: string;
		if (typeof body === 'string') {
			str = body;
		} else if (body instanceof URLSearchParams) {
			str = body.toString();
		} else if (typeof body === 'object' && body !== null) {
			str = JSON.stringify(body);
		} else {
			str = String(body);
		}

		return this.hashCode(str).toString();
	}

	private hashCode(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash;
		}
		return hash;
	}
}
