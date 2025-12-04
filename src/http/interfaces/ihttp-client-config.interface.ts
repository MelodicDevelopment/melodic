export interface IHttpClientConfig {
	baseURL?: string;
	headers?: Record<string, string>;
	credentials?: RequestCredentials;
	mode?: RequestMode;
}
