/**
 * Request Deduplication and Cancellation Manager
 */

import type { RequestConfig, HttpResponse } from './types';

interface PendingRequest<T = any> {
	promise: Promise<HttpResponse<T>>;
	abortController: AbortController;
	requesters: number;
}

export class RequestManager {
	private pendingRequests = new Map<string, PendingRequest>();

	generateRequestKey(method: string, url: string, body?: BodyInit | null): string {
		let key = `${method}:${url}`;

		if (body) {
			key += `:${this.hashBody(body)}`;
		}

		return key;
	}

	hasPendingRequest(key: string): boolean {
		return this.pendingRequests.has(key);
	}

	getPendingRequest<T = any>(key: string): Promise<HttpResponse<T>> | null {
		const pending = this.pendingRequests.get(key);
		if (!pending) return null;

		// Increment requesters count
		pending.requesters++;

		return pending.promise;
	}

	addPendingRequest<T = any>(
		key: string,
		promise: Promise<HttpResponse<T>>,
		abortController: AbortController
	): void {
		this.pendingRequests.set(key, {
			promise,
			abortController,
			requesters: 1
		});

		// Clean up after completion
		promise.finally(() => {
			this.removePendingRequest(key);
		});
	}

	cancelPendingRequest(key: string, reason?: string): void {
		const pending = this.pendingRequests.get(key);
		if (pending) {
			pending.abortController.abort(reason);
			this.pendingRequests.delete(key);
		}
	}

	cancelAllRequests(reason?: string): void {
		for (const [key, pending] of this.pendingRequests.entries()) {
			pending.abortController.abort(reason);
		}
		this.pendingRequests.clear();
	}

	private removePendingRequest(key: string): void {
		const pending = this.pendingRequests.get(key);
		if (pending) {
			pending.requesters--;
			// Only remove if no more requesters
			if (pending.requesters <= 0) {
				this.pendingRequests.delete(key);
			}
		}
	}

	private hashBody(body: BodyInit): string {
		let str: string;

		if (typeof body === 'string') {
			str = body;
		} else if (body instanceof FormData) {
			str = '[FormData]';
		} else if (body instanceof Blob) {
			str = `[Blob:${body.size}]`;
		} else if (body instanceof ArrayBuffer) {
			str = `[ArrayBuffer:${body.byteLength}]`;
		} else if (body instanceof URLSearchParams) {
			str = body.toString();
		} else {
			str = String(body);
		}

		return this.hashCode(str).toString();
	}

	private hashCode(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash;
		}
		return hash;
	}
}
