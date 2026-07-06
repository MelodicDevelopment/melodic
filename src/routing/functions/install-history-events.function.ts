import type { IRouterEventState } from '../interfaces/irouter-event-state.interface';
import type { RouterStateEvent } from '../types/router-state-event.type';

/**
 * Build the state payload dispatched with a window `NavigationEvent`.
 */
export const routerStateEvent = (type: RouterStateEvent, data: unknown, title: string, url: string): PopStateEvent => {
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

let historyEventsInstalled = false;

/**
 * Patch `history.pushState`/`history.replaceState` so every history mutation
 * emits a window `NavigationEvent` (used by router links to refresh their
 * active state, and by anything else observing navigation).
 *
 * Idempotent: safe to call multiple times (bootstrap via `provideRouter()`,
 * `RouterService` construction, tests) — the patch is applied exactly once.
 */
export function installHistoryEvents(): void {
	if (historyEventsInstalled) {
		return;
	}
	historyEventsInstalled = true;

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
}
