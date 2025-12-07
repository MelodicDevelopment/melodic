import type { HttpClient } from '../../http/http-client.class';
import type { Token } from '../../injection';

export interface IMelodicApp {
	isDevMode: boolean;
	get<T>(token: Token<T>): T;
	http?: HttpClient;
	rootElement?: HTMLElement;
	destroy(): void;
}
