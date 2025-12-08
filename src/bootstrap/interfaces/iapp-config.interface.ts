import type { IHttpClientConfig } from '../../http/interfaces/ihttp-client-config.interface';
import type { Provider } from '../types/provider.type';

export interface IAppConfig {
	http?: IHttpClientConfig;
	providers?: Provider[];
	devMode?: boolean;
	onError?: (error: Error, context: 'error' | 'unhandledrejection') => void;
	onBefore?: () => void | Promise<void>;
	onReady?: () => void;
	rootComponent?: string;
	target?: string | HTMLElement;
}
