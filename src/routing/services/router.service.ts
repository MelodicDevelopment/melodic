import { Injectable } from '../../injection/decorators/injectable.decorator';
import type { IRouterEventState } from '../interfaces/irouter-event-state.interface';
import type { RouterStateEvent } from '../types/router-state-event.type';

const routerStateEvent = (type: RouterStateEvent, data: unknown, title: string, url: string): PopStateEvent => {
	return new PopStateEvent('History', {
		state: {
			type: type,
			data: data,
			url: url,
			host: window.location.host,
			hostName: window.location.hostname,
			href: window.location.href,
			pathName: window.location.pathname,
			port: window.location.port,
			protocol: window.location.protocol,
			params: new URLSearchParams(window.location.search),
			title: title
		} as IRouterEventState
	});
};

const pushState = history.pushState;
history.pushState = (data: unknown, title: string, url?: string | URL | null): void => {
	pushState.apply(history, [data, title, url]);

	const navigationEvent = new CustomEvent('NavigationEvent', {
		detail: routerStateEvent('push', data, title, url as string)
	});
	window.dispatchEvent(navigationEvent);
};

const replaceState = history.replaceState;
history.replaceState = (data: unknown, title: string, url?: string | URL | null): void => {
	replaceState.apply(history, [data, title, url]);

	const navigationEvent = new CustomEvent('NavigationEvent', {
		detail: routerStateEvent('replace', data, title, url as string)
	});
	window.dispatchEvent(navigationEvent);
};

@Injectable({
	token: 'Router',
	singleton: true
})
export class RouterService {
	#route: IRouterEventState | undefined;
	#navigationHandler: ((event: Event) => void) | null = null;
	#popstateHandler: ((event: PopStateEvent) => void) | null = null;

	constructor() {
		this.#navigationHandler = (event: Event) => {
			this.#route = ((event as CustomEvent).detail as PopStateEvent).state;
		};

		this.#popstateHandler = (event: PopStateEvent) => {
			const navigationEvent = new CustomEvent('NavigationEvent', {
				detail: routerStateEvent('push', event.state, '', window.location.pathname)
			});
			window.dispatchEvent(navigationEvent);
		};

		window.addEventListener('NavigationEvent', this.#navigationHandler);
		window.addEventListener('popstate', this.#popstateHandler);
	}

	destroy(): void {
		if (this.#navigationHandler) {
			window.removeEventListener('NavigationEvent', this.#navigationHandler);
			this.#navigationHandler = null;
		}
		if (this.#popstateHandler) {
			window.removeEventListener('popstate', this.#popstateHandler);
			this.#popstateHandler = null;
		}
	}

	getRoute(): IRouterEventState {
		return this.#route as IRouterEventState;
	}

	navigate(path: string, data?: unknown): void {
		history.pushState(data, '', path);
	}

	replace(path: string, data?: unknown): void {
		history.replaceState(data, '', path);
	}
}
