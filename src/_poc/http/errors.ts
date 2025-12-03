/**
 * HTTP Client Errors
 */

import type { RequestConfig, HttpResponse } from './types';

export class HttpError extends Error {
	constructor(
		message: string,
		public readonly config: RequestConfig,
		public readonly code?: string
	) {
		super(message);
		this.name = 'HttpError';
		Object.setPrototypeOf(this, HttpError.prototype);
	}
}

export class NetworkError extends HttpError {
	constructor(message: string, config: RequestConfig) {
		super(message, config, 'NETWORK_ERROR');
		this.name = 'NetworkError';
		Object.setPrototypeOf(this, NetworkError.prototype);
	}
}

export class TimeoutError extends HttpError {
	constructor(
		public readonly timeout: number,
		config: RequestConfig
	) {
		super(`Request timeout after ${timeout}ms`, config, 'TIMEOUT');
		this.name = 'TimeoutError';
		Object.setPrototypeOf(this, TimeoutError.prototype);
	}
}

export class AbortError extends HttpError {
	constructor(message: string, config: RequestConfig) {
		super(message, config, 'ABORTED');
		this.name = 'AbortError';
		Object.setPrototypeOf(this, AbortError.prototype);
	}
}

export class HTTPError extends HttpError {
	constructor(
		message: string,
		public readonly response: HttpResponse,
		config: RequestConfig
	) {
		super(message, config, `HTTP_${response.status}`);
		this.name = 'HTTPError';
		Object.setPrototypeOf(this, HTTPError.prototype);
	}
}
