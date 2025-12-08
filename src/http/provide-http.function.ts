import type { Provider } from '../bootstrap/types/provider.type';
import { HttpClient } from './http-client.class';
import type { IHttpClientConfig, IHttpRequestInterceptor, IHttpResponseInterceptor } from './interfaces';

export function provideHttp(
	httpClientConfig: IHttpClientConfig,
	interceptors?: { request?: IHttpRequestInterceptor[]; response?: IHttpResponseInterceptor[] }
): Provider {
	return (injector) => {
		const httpClient = new HttpClient(httpClientConfig);

		injector.bindValue(HttpClient, httpClient);

		if (interceptors?.request) {
			interceptors.request.forEach((interceptor) => {
				httpClient.interceptors.request(interceptor);
			});
		}

		if (interceptors?.response) {
			interceptors.response.forEach((interceptor) => {
				httpClient.interceptors.response(interceptor);
			});
		}
	};
}
