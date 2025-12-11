import type { RouterStateEvent } from '../types/router-state-event.type';

export interface IRouterEventState {
	type: RouterStateEvent;
	data: unknown;
	url: string;
	host: string;
	hostName: string;
	href: string;
	pathName: string;
	port: string;
	protocol: string;
	params: URLSearchParams;
	title?: string;
}
