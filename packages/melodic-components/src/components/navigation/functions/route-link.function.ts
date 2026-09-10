import { Injector, RouterService } from '@melodicdev/core';

/**
 * Intercept an anchor click and route it through the router when possible.
 *
 * Navigation components rendered raw `<a href>` elements with no
 * `preventDefault`, so clicking one triggered a full page load — while tabs and
 * steps in the same app navigated client-side. That inconsistency reloads the
 * whole SPA (losing state) on what looks like ordinary in-app navigation.
 *
 * Native behaviour is preserved where it is the right thing:
 * - modifier / non-primary clicks (new tab, new window, download)
 * - external links, explicit `target`, and non-http(s) schemes
 * - apps with no router registered
 *
 * Returns true when the router handled it.
 */
export function routeAnchorClick(event: MouseEvent, href: string, options: { external?: boolean; target?: string } = {}): boolean {
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
		return false;
	}

	if (!href || options.external || (options.target && options.target !== '_self')) {
		return false;
	}

	// Absolute URLs to another origin, mailto:, tel:, … stay native.
	if (/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith(window.location.origin)) {
		return false;
	}

	if (!Injector.has(RouterService)) {
		return false;
	}

	event.preventDefault();
	void Injector.get<RouterService>(RouterService).navigate(href);
	return true;
}
