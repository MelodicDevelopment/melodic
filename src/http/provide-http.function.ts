import type { Provider } from '../bootstrap/types/provider.type';
import { HttpClient } from './http-client.class';
import type { IHttpClientConfig } from './interfaces';

export function provideHttp(httpClientConfig: IHttpClientConfig): Provider {
	return (injector) => {
		const httpClient = new HttpClient(httpClientConfig);
		injector.bindValue(HttpClient, httpClient);
	};
}
