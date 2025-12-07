import type { IHttpClientConfig } from '../../http/interfaces/ihttp-client-config.interface';

export interface IAppConfig {
	http?: IHttpClientConfig;
	devMode?: boolean;
	onError?: (error: Error, context: 'error' | 'unhandledrejection') => void;
	onBefore?: () => void | Promise<void>;
	onReady?: () => void;
	rootComponent?: string;
	target?: string | HTMLElement;
}
