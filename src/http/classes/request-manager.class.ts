import type { IHttpResponse } from '../interfaces/ihttp-response.interface';
import type { HttpRequestBody } from '../types/http-request-body.type';

interface IPendingRequest<T = any> {
	/** The fully-interceptored response promise shared by all participants. */
	promise: Promise<IHttpResponse<T>>;
	/** Controls the single underlying fetch. */
	abortController: AbortController;
	/**
	 * Number of participants still interested in the response. Participants
	 * that joined without an abort signal can never leave, which (correctly)
	 * keeps the underlying request alive forever.
	 */
	remainingParticipants: number;
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

	/**
	 * Joins an in-flight request as an additional participant. The caller's
	 * abort signal is ref-counted: the underlying request is aborted only when
	 * EVERY participant has aborted.
	 *
	 * Returns the shared (post-interceptor) response promise, or null when no
	 * request is pending for the key.
	 */
	public joinPendingRequest<T = any>(key: string, signal?: AbortSignal): Promise<IHttpResponse<T>> | null {
		const pending = this._pendingRequests.get(key);

		if (!pending) {
			return null;
		}

		this.registerParticipant(pending, signal);
		return pending.promise as Promise<IHttpResponse<T>>;
	}

	/**
	 * Registers a new shared request. `promise` must be the post-interceptor
	 * promise so late joiners never re-run response interceptors.
	 */
	public addPendingRequest<T = any>(
		key: string,
		promise: Promise<IHttpResponse<T>>,
		abortController: AbortController,
		signal?: AbortSignal
	): Promise<IHttpResponse<T>> {
		const pending: IPendingRequest<T> = {
			promise,
			abortController,
			remainingParticipants: 0
		};

		this._pendingRequests.set(key, pending);
		this.registerParticipant(pending, signal);

		// Participants consume the promise through their own per-caller wrappers;
		// when every caller aborts early, nobody is left to observe the shared
		// rejection — observe it here so it never surfaces as unhandled.
		promise.then(
			() => this.removePendingRequest(key),
			() => this.removePendingRequest(key)
		);

		return promise;
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

	private registerParticipant(pending: IPendingRequest, signal?: AbortSignal): void {
		pending.remainingParticipants++;

		if (!signal) {
			// No way for this participant to abort — it holds the request open.
			return;
		}

		const leave = (): void => {
			pending.remainingParticipants--;
			if (pending.remainingParticipants === 0) {
				pending.abortController.abort(signal.reason);
			}
		};

		if (signal.aborted) {
			leave();
		} else {
			signal.addEventListener('abort', leave, { once: true });
		}
	}

	private removePendingRequest(key: string): void {
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
