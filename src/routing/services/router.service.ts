import { Injectable } from '../../injection/decorators/injectable.decorator';
import { signal, type Signal } from '../../signals';
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

@Injectable()
export class RouterService {
	private _navigationHandler: ((event: Event) => void) | null = null;
	private _popstateHandler: ((event: PopStateEvent) => void) | null = null;

	public route: Signal<IRouterEventState | undefined> = signal<IRouterEventState | undefined>(undefined);

	constructor() {
		this._navigationHandler = (event: Event) => {
			this.route.set(((event as CustomEvent).detail as PopStateEvent).state);
		};

		this._popstateHandler = (event: PopStateEvent) => {
			const navigationEvent = new CustomEvent('NavigationEvent', {
				detail: routerStateEvent('push', event.state, '', window.location.pathname)
			});

			window.dispatchEvent(navigationEvent);
		};

		window.addEventListener('NavigationEvent', this._navigationHandler);
		window.addEventListener('popstate', this._popstateHandler);
	}

	destroy(): void {
		if (this._navigationHandler) {
			window.removeEventListener('NavigationEvent', this._navigationHandler);
			this._navigationHandler = null;
		}
		if (this._popstateHandler) {
			window.removeEventListener('popstate', this._popstateHandler);
			this._popstateHandler = null;
		}
	}

	navigate(path: string, data?: unknown): void {
		history.pushState(data, '', path);
	}

	replace(path: string, data?: unknown): void {
		history.replaceState(data, '', path);
	}
}
