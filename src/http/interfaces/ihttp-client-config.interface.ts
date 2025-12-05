export interface IHttpClientConfig {
	baseURL?: string;
	defaultHeaders?: Record<string, string>;
	credentials?: RequestCredentials;
	mode?: RequestMode;
}
