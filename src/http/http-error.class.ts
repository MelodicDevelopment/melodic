import type { IHttpResponse } from './interfaces/ihttp-response.interface';
import type { IRequestConfig } from './interfaces/irequest-config.interface';

export abstract class HttpBaseError extends Error {
	constructor(message: string, public readonly config: IRequestConfig, public readonly code?: string) {
		super(message);
		this.name = 'HttpBaseError';
		Object.setPrototypeOf(this, HttpBaseError.prototype);
	}
}

export class HttpError extends HttpBaseError {
	constructor(message: string, public readonly response: IHttpResponse, config: IRequestConfig) {
		super(message, config, `HTTP_${response.status}`);
		this.name = 'HttpError';
		Object.setPrototypeOf(this, HttpError.prototype);
	}
}

export class NetworkError extends HttpBaseError {
	constructor(message: string, config: IRequestConfig) {
		super(message, config, 'NETWORK_ERROR');
		this.name = 'NetworkError';
		Object.setPrototypeOf(this, NetworkError.prototype);
	}
}

export class TimeoutError extends HttpBaseError {
	constructor(public readonly timeout: number, config: IRequestConfig) {
		super(`Request timeout after ${timeout}ms`, config, 'TIMEOUT');
		this.name = 'TimeoutError';
		Object.setPrototypeOf(this, TimeoutError.prototype);
	}
}

export class AbortError extends HttpBaseError {
	constructor(message: string, config: IRequestConfig) {
		super(message, config, 'ABORTED');
		this.name = 'AbortError';
		Object.setPrototypeOf(this, AbortError.prototype);
	}
}
