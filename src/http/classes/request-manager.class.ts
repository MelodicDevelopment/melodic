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
	/**
	 * Detaches every participant's abort listener. Run on settlement and on
	 * cancellation so a long-lived caller signal does not retain the settled
	 * promise (and its response) through a stale listener.
	 */
	cleanups: Array<() => void>;
}

/** Everything about a request that can change what the server answers. */
export interface IRequestIdentity {
	method: string;
	url: string;
	params?: Record<string, unknown>;
	headers?: Record<string, string>;
	credentials?: RequestCredentials;
	mode?: RequestMode;
	body?: HttpRequestBody;
}

export class RequestManager {
	private _pendingRequests = new Map<string, IPendingRequest>();
	private _opaqueCounter = 0;

	/**
	 * Identity used to decide whether two in-flight requests may share one
	 * fetch. Anything that can alter the response participates: method, URL,
	 * query params, headers (case-insensitive names, order-independent),
	 * credentials, mode and body. Two GETs to `/me` with different
	 * `Authorization` headers therefore never share a response.
	 *
	 * The key is the full serialized identity, not a hash, so equal keys mean
	 * equal requests.
	 */
	public generateRequestKey(identity: IRequestIdentity): string {
		const headers = Object.entries(identity.headers ?? {})
			.map(([name, value]) => [name.toLowerCase(), value] as const)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

		return JSON.stringify([
			identity.method.toUpperCase(),
			identity.url,
			identity.params ? this.serializeParams(identity.params) : '',
			headers,
			identity.credentials ?? '',
			identity.mode ?? '',
			identity.body === undefined || identity.body === null ? '' : this.serializeBody(identity.body)
		]);
	}

	private serializeParams(params: Record<string, unknown>): string {
		return JSON.stringify(
			Object.entries(params)
				.filter(([, value]) => value !== null && value !== undefined)
				.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
		);
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
			remainingParticipants: 0,
			cleanups: []
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
			this.releasePendingRequest(key, pending);
		}
	}

	public cancelAllRequests(reason?: string): void {
		this._pendingRequests.forEach((pending, key) => {
			pending.abortController.abort(reason);
			this.releasePendingRequest(key, pending);
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
			pending.cleanups.push(() => signal.removeEventListener('abort', leave));
		}
	}

	private removePendingRequest(key: string): void {
		const pending = this._pendingRequests.get(key);
		if (pending) {
			this.releasePendingRequest(key, pending);
		}
	}

	/** Forget a request and detach every participant listener it registered. */
	private releasePendingRequest(key: string, pending: IPendingRequest): void {
		this._pendingRequests.delete(key);
		const cleanups = pending.cleanups;
		pending.cleanups = [];
		for (const cleanup of cleanups) {
			cleanup();
		}
	}

	private serializeBody(body: HttpRequestBody): string {
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

		return str;
	}
}
