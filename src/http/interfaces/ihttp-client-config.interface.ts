export interface IHttpClientConfig {
	baseURL?: string;
	defaultHeaders?: Record<string, string>;
	credentials?: RequestCredentials;
	mode?: RequestMode;
	/**
	 * Send `defaultHeaders` and `credentials` to every URL, including absolute
	 * URLs on an origin other than `baseURL`'s (or the page's). Off by default:
	 * a default `Authorization` header is meant for your API, not for whichever
	 * third-party URL a request happens to name. Headers and credentials set on
	 * the request itself are always sent.
	 */
	allowCrossOriginDefaults?: boolean;
}
