import { Injector } from '../../injection';
import { RouterService } from '../services/router.service';
import type { INavigationOptions } from '../interfaces/inavigation-options.interface';
import { isSafeUrl } from '../functions/is-safe-url.function';

/**
 * Options shared by the `:routerLink` directive and the `<router-link>`
 * element.
 */
export interface IRouterLinkOptions {
	/** Target path for navigation */
	href: string;

	/** CSS class to apply when this link is active (default: 'active') */
	activeClass?: string;

	/** Whether to match exact path or prefix (default: false) */
	exactMatch?: boolean;

	/** Whether to replace history instead of push (default: false) */
	replace?: boolean;

	/** Custom data to pass with navigation */
	data?: unknown;

	/** Query parameters to append */
	queryParams?: Record<string, string>;
}

/**
 * Shared behavior behind the `:routerLink` attribute directive and the
 * `<router-link>` element — one implementation of href management, active
 * state, safe-URL enforcement and click handling, so the two public APIs
 * can't drift apart.
 *
 * Click semantics:
 * - plain left click → `preventDefault` + router navigation
 * - modifier click (ctrl/cmd/shift/alt) → native browser behavior on
 *   anchors (new tab/window/download); `window.open` for non-anchors
 * - middle click (`auxclick`) → native on anchors; `window.open` otherwise
 * - `javascript:` (or any non-http(s), non-relative) URLs are never
 *   assigned to `href`, navigated to, or passed to `window.open`
 */
export class RouterLinkCore {
	private _host: Element;
	private _getAnchor: () => HTMLAnchorElement | null;
	private _router: RouterService;
	private _options: IRouterLinkOptions = { href: '' };
	private _appliedActiveClass: string | null = null;
	private _cleanups: (() => void)[] = [];

	/**
	 * @param host element that receives listeners and the active class
	 * @param getAnchor anchor that receives `href`/`aria-current`; defaults to
	 *   the host itself when the host is an `<a>` (directive usage). The
	 *   `<router-link>` element passes its shadow anchor here.
	 */
	constructor(host: Element, getAnchor?: () => HTMLAnchorElement | null) {
		this._host = host;
		this._getAnchor = getAnchor ?? (() => (host.tagName.toLowerCase() === 'a' ? (host as HTMLAnchorElement) : null));
		this._router = Injector.get<RouterService>(RouterService);

		const clickHandler = (e: Event): void => this.handleClick(e as MouseEvent);
		const auxClickHandler = (e: Event): void => this.handleAuxClick(e as MouseEvent);
		const navigationHandler = (): void => this.updateActiveState();

		host.addEventListener('click', clickHandler);
		host.addEventListener('auxclick', auxClickHandler);
		window.addEventListener('NavigationEvent', navigationHandler);

		this._cleanups.push(
			() => host.removeEventListener('click', clickHandler),
			() => host.removeEventListener('auxclick', auxClickHandler),
			() => window.removeEventListener('NavigationEvent', navigationHandler)
		);
	}

	public setOptions(options: IRouterLinkOptions): void {
		this._options = options;
		this.applyHref();
		this.updateActiveState();
	}

	public destroy(): void {
		this._cleanups.forEach((cleanup) => cleanup());
		this._cleanups = [];
	}

	/** Target path including query params (merged, not double-`?` appended). */
	public buildFullPath(): string {
		let path = this._options.href ?? '';
		const queryParams = this._options.queryParams;

		if (queryParams && Object.keys(queryParams).length > 0) {
			const params = new URLSearchParams(queryParams);
			path = `${path}${path.includes('?') ? '&' : '?'}${params.toString()}`;
		}

		return path;
	}

	private isSafe(): boolean {
		return isSafeUrl(this._options.href ?? '') && isSafeUrl(this.buildFullPath());
	}

	private warnUnsafe(): void {
		console.warn(`routerLink: blocked unsafe URL '${this._options.href}'. Only http(s), relative, query and hash URLs are allowed.`);
	}

	private applyHref(): void {
		const anchor = this._getAnchor();
		if (!anchor) {
			return;
		}

		if (this.isSafe()) {
			anchor.href = this.buildFullPath();
		} else {
			this.warnUnsafe();
			anchor.removeAttribute('href');
		}
	}

	private handleClick(e: MouseEvent): void {
		if (e.defaultPrevented) {
			return;
		}

		// Non-primary buttons: let the browser handle them.
		if (e.button !== undefined && e.button !== 0) {
			return;
		}

		// Modifier keys: preserve native behavior (new tab/window/download) —
		// do NOT preventDefault.
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
			if (!this._getAnchor()) {
				// Non-anchor hosts have no native navigation — emulate new-tab.
				this.openInNewTab();
			}
			return;
		}

		e.preventDefault();

		if (!this.isSafe()) {
			this.warnUnsafe();
			return;
		}

		const { href, data = null, replace = false, queryParams = {} } = this._options;
		const navOptions: INavigationOptions = { data, replace, queryParams };

		void this._router.navigate(href, navOptions);
	}

	private handleAuxClick(e: MouseEvent): void {
		// Middle click only; anchors get native new-tab behavior.
		if (e.defaultPrevented || e.button !== 1) {
			return;
		}

		if (this._getAnchor()) {
			return;
		}

		e.preventDefault();
		this.openInNewTab();
	}

	private openInNewTab(): void {
		if (!this.isSafe()) {
			this.warnUnsafe();
			return;
		}

		window.open(this.buildFullPath(), '_blank');
	}

	public updateActiveState(): void {
		const { href = '', activeClass = 'active', exactMatch = false } = this._options;

		const currentPath = window.location.pathname;
		const linkPath = (href.startsWith('/') ? href : `/${href}`).split(/[?#]/)[0];
		const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
		const normalizedLinkPath = linkPath.replace(/\/$/, '') || '/';

		let isActive: boolean;

		if (exactMatch) {
			isActive = normalizedCurrentPath === normalizedLinkPath;
		} else {
			isActive = normalizedCurrentPath === normalizedLinkPath || normalizedCurrentPath.startsWith(normalizedLinkPath + '/');
		}

		// The active class name can change between updates — drop the old one.
		if (this._appliedActiveClass && this._appliedActiveClass !== activeClass) {
			this._host.classList.remove(this._appliedActiveClass);
		}

		const ariaTarget = this._getAnchor();

		if (isActive) {
			this._host.classList.add(activeClass);
			this._appliedActiveClass = activeClass;
			ariaTarget?.setAttribute('aria-current', 'page');
		} else {
			this._host.classList.remove(activeClass);
			this._appliedActiveClass = null;
			ariaTarget?.removeAttribute('aria-current');
		}
	}
}
