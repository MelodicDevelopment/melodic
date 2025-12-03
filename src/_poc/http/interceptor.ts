/**
 * Interceptor Management
 */

import type { RequestInterceptor, ResponseInterceptor, RequestConfig, HttpResponse } from './types';

export class InterceptorManager {
	private requestInterceptors: RequestInterceptor[] = [];
	private responseInterceptors: ResponseInterceptor[] = [];

	addRequestInterceptor(interceptor: RequestInterceptor): () => void {
		this.requestInterceptors.push(interceptor);
		return () => this.removeRequestInterceptor(interceptor);
	}

	addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
		this.responseInterceptors.push(interceptor);
		return () => this.removeResponseInterceptor(interceptor);
	}

	removeRequestInterceptor(interceptor: RequestInterceptor): void {
		const index = this.requestInterceptors.indexOf(interceptor);
		if (index !== -1) {
			this.requestInterceptors.splice(index, 1);
		}
	}

	removeResponseInterceptor(interceptor: ResponseInterceptor): void {
		const index = this.responseInterceptors.indexOf(interceptor);
		if (index !== -1) {
			this.responseInterceptors.splice(index, 1);
		}
	}

	async runRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
		let currentConfig = config;

		for (const interceptor of this.requestInterceptors) {
			try {
				if (interceptor.onFulfilled) {
					currentConfig = await interceptor.onFulfilled(currentConfig);
				}
			} catch (error) {
				if (interceptor.onRejected) {
					await interceptor.onRejected(error as Error);
				}
				throw error;
			}
		}

		return currentConfig;
	}

	async runResponseInterceptors<T = any>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
		let currentResponse = response;

		for (const interceptor of this.responseInterceptors) {
			try {
				if (interceptor.onFulfilled) {
					currentResponse = await interceptor.onFulfilled(currentResponse);
				}
			} catch (error) {
				if (interceptor.onRejected) {
					await interceptor.onRejected(error as Error);
				}
				throw error;
			}
		}

		return currentResponse;
	}

	async runResponseErrorInterceptors(error: Error): Promise<never> {
		let currentError = error;

		for (const interceptor of this.responseInterceptors) {
			try {
				if (interceptor.onRejected) {
					await interceptor.onRejected(currentError);
				}
			} catch (e) {
				currentError = e as Error;
			}
		}

		throw currentError;
	}

	clear(): void {
		this.requestInterceptors = [];
		this.responseInterceptors = [];
	}
}
