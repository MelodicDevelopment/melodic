import { Injectable } from '../../injection/decorators/injectable.decorator';
import { signal } from '../../signals';
import type { Signal } from '../../signals';
import type { IRouterEventState } from '../interfaces/irouter-event-state.interface';
import type { IRouteGuard } from '../interfaces/iroute-guard.interface';
import type { IRouteResolver } from '../interfaces/iroute-resolver.interface';
import { RouteContextService } from './route-context.service';
import type { IResolverContext } from '../interfaces/iresolver-context.interface';
import type { AsyncGuardResult } from '../types/guard-result.type';
import type { IGuardContext } from '../interfaces/iguard-context.interface';
import type { INavigationOptions } from '../interfaces/inavigation-options.interface';
import type { INavigationResult } from '../interfaces/inavigation-result.interface';
import type { IRoute } from '../interfaces/iroute.interface';
import type { IRouteMatch } from '../interfaces/iroute-match.interface';
import type { IRouteMatchResult } from '../interfaces/iroute-match-result.interface';
import { matchRouteTree } from '../functions/match-route-tree.function';
import { buildPathFromRoute } from '../functions/build-path-from-route.function';
import { installHistoryEvents, routerStateEvent } from '../functions/install-history-events.function';

@Injectable()
export class RouterService {
	private _route: IRouterEventState | undefined;
	private _routes: IRoute[] = [];
	private _contextService: RouteContextService;
	private _currentMatches: IRouteMatch[] = [];
	private _currentPath: string = `${window.location.pathname}${window.location.search}`;
	// Monotonic id so a slower navigation can detect it was superseded by a newer
	// one after an await (guards/resolvers) and bail before committing.
	private _navigationId = 0;
	// The target of the in-flight programmatic navigation, used to build accurate
	// guard/resolver contexts before history is updated. Null during popstate
	// (where window.location is already the target) and when idle.
	private _pendingTarget: { pathname: string; queryParams: URLSearchParams } | null = null;
	// The last match result the full pipeline (match → guards → resolvers)
	// committed. Outlets are dumb renderers reacting to this signal — they never
	// run guards or resolvers themselves.
	private _committedRoute: Signal<IRouteMatchResult | null>;
	private _navigationListener: EventListener;
	private _popStateListener: (event: PopStateEvent) => void;

	constructor() {
		installHistoryEvents();

		this._contextService = new RouteContextService();
		this._committedRoute = signal<IRouteMatchResult | null>(null);

		this._navigationListener = (event: Event) => {
			this._route = ((event as CustomEvent).detail as PopStateEvent).state;
		};
		window.addEventListener('NavigationEvent', this._navigationListener);

		this._popStateListener = (event: PopStateEvent) => {
			void this.handlePopState(event);
		};
		window.addEventListener('popstate', this._popStateListener);
	}

	/**
	 * Signal holding the last committed route match result (null until the
	 * first navigation commits). Emits after the whole match → guards →
	 * resolvers pipeline succeeds, for programmatic navigation, initial load
	 * and popstate alike.
	 */
	public get committedRoute(): Signal<IRouteMatchResult | null> {
		return this._committedRoute;
	}

	/** Remove the service's window listeners (tests / teardown). */
	public destroy(): void {
		window.removeEventListener('NavigationEvent', this._navigationListener);
		window.removeEventListener('popstate', this._popStateListener);
	}

	public setRoutes(routes: IRoute[]): void {
		this._routes = routes;
	}

	public getRoutes(): IRoute[] {
		return this._routes;
	}

	public getContextService(): RouteContextService {
		return this._contextService;
	}

	public getRoute(): IRouterEventState | undefined {
		return this._route;
	}

	public getParams(): Record<string, string> {
		return this._contextService.getCurrentParams();
	}

	public getParam(name: string): string | undefined {
		return this._contextService.getCurrentParams()[name];
	}

	public getQueryParams(): URLSearchParams {
		return this.targetQueryParams();
	}

	public getCurrentMatches(): IRouteMatch[] {
		return [...this._currentMatches];
	}

	public getRouteData(depth?: number): Record<string, unknown> {
		return this._contextService.getMergedRouteData(depth);
	}

	public getResolvedData(depth?: number): Record<string, unknown> {
		return this._contextService.getMergedResolvedData(depth);
	}

	public matchPath(path: string): IRouteMatchResult {
		return matchRouteTree(this._routes, this.normalizePath(path));
	}

	/** Split a URL into its pathname / search / hash parts. */
	private parseUrl(url: string): { pathname: string; search: string; hash: string } {
		const hashIndex = url.indexOf('#');
		const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
		const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;

		const queryIndex = withoutHash.indexOf('?');
		const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
		const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;

		return { pathname, search, hash };
	}

	/** Matchable pathname: query and hash stripped, trailing slash collapsed. */
	private normalizePath(url: string): string {
		const { pathname } = this.parseUrl(url);
		return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
	}

	private targetPathname(): string {
		return this._pendingTarget ? this._pendingTarget.pathname : window.location.pathname;
	}

	private targetQueryParams(): URLSearchParams {
		return new URLSearchParams(this._pendingTarget ? this._pendingTarget.queryParams : window.location.search);
	}

	public setCurrentMatches(result: IRouteMatchResult): void {
		this._currentMatches = result.matches;
		this._contextService.setMatchResult(result);
	}

	/** Store the matches/context AND notify outlets via the committed signal. */
	private commit(result: IRouteMatchResult): void {
		this.setCurrentMatches(result);
		this._committedRoute.set(result);
	}

	/**
	 * Run the full pipeline (match → guards → resolvers → commit) for the
	 * CURRENT location without touching history. Called once by the root
	 * outlet on startup; also re-run when the root outlet's routes change.
	 */
	public async initialNavigation(): Promise<INavigationResult> {
		const navId = ++this._navigationId;
		const currentUrl = `${window.location.pathname}${window.location.search}`;
		const matchResult = this.matchPath(window.location.pathname);

		if (matchResult.redirectTo) {
			if (this.normalizePath(window.location.pathname) !== this.normalizePath(matchResult.redirectTo)) {
				return this.navigate(matchResult.redirectTo, { replace: true });
			}
		}

		if (matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);
			if (this._navigationId !== navId) {
				return { success: false, error: 'Navigation superseded' };
			}
			if (guardResult !== true) {
				if (typeof guardResult === 'string') {
					return this.navigate(guardResult, { replace: true, skipGuards: true });
				}
				return { success: false, error: 'Navigation blocked by guard' };
			}

			const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
			if (this._navigationId !== navId) {
				return { success: false, error: 'Navigation superseded' };
			}
			if (!resolverResult.success) {
				// Commit an empty result so outlets render their 404 view
				// (mirrors the previous initial-load behavior).
				this.commit({ matches: [], params: {}, isExactMatch: false });
				return { success: false, error: resolverResult.error ?? 'Navigation blocked by resolver' };
			}
		}

		this._currentPath = currentUrl;
		this.commit(matchResult);

		return { success: true, url: currentUrl };
	}

	public async navigate(path: string, options: INavigationOptions = {}): Promise<INavigationResult> {
		const { data, replace = false, queryParams, skipGuards = false, skipResolvers = false, scrollToTop = true } = options;

		let fullPath = path;
		if (queryParams && Object.keys(queryParams).length > 0) {
			const params = new URLSearchParams(queryParams);
			// Merge with an existing query string instead of appending a second `?`.
			fullPath = `${path}${path.includes('?') ? '&' : '?'}${params.toString()}`;
		}

		// Claim this navigation. Any newer navigate() bumps the id, letting this
		// one detect it was superseded after an await and bail before committing.
		const navId = ++this._navigationId;
		const { pathname, search } = this.parseUrl(fullPath);
		this._pendingTarget = { pathname, queryParams: new URLSearchParams(search) };

		const superseded = (): INavigationResult => ({ success: false, error: 'Navigation superseded' });

		try {
			if (!skipGuards && this._currentMatches.length > 0) {
				const deactivateResult = await this.runDeactivationGuards(fullPath);
				if (this._navigationId !== navId) {
					return superseded();
				}
				if (deactivateResult !== true) {
					if (typeof deactivateResult === 'string') {
						return this.navigate(deactivateResult, { ...options, skipGuards: true });
					}
					return { success: false, error: 'Navigation blocked by guard' };
				}
			}

			const matchResult = this.matchPath(path);

			if (matchResult.redirectTo) {
				// Honor the caller's original push/replace intent. Forcing
				// `replace: true` here would erase the previous unrelated history
				// entry: the source URL never gets pushed (this call returns
				// before reaching pushState below), so a replaceState on the
				// redirect target lands on whichever entry was current — i.e. the
				// page the user just came from — instead of becoming a new entry.
				return this.navigate(matchResult.redirectTo, options);
			}

			if (!skipGuards && matchResult.matches.length > 0) {
				const guardResult = await this.runGuards(matchResult);
				if (this._navigationId !== navId) {
					return superseded();
				}
				if (guardResult !== true) {
					if (typeof guardResult === 'string') {
						return this.navigate(guardResult, { ...options, skipGuards: true });
					}
					return { success: false, error: 'Navigation blocked by guard' };
				}
			}

			if (!skipResolvers && matchResult.matches.length > 0) {
				const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
				if (this._navigationId !== navId) {
					return superseded();
				}
				if (!resolverResult.success) {
					return { success: false, error: resolverResult.error ?? 'Navigation blocked by resolver' };
				}
			}

			// Params/context must be current before the history update fires
			// NavigationEvent…
			this.setCurrentMatches(matchResult);

			if (replace) {
				history.replaceState(data, '', fullPath);
			} else {
				history.pushState(data, '', fullPath);
			}
			this._currentPath = fullPath;

			// …while outlets must only render once window.location reflects the
			// target (components commonly read the location on create).
			this._committedRoute.set(matchResult);

			if (scrollToTop) {
				const hash = fullPath.includes('#') ? fullPath.split('#')[1] : null;
				if (hash) {
					const element = document.getElementById(hash);
					if (element) {
						element.scrollIntoView();
					}
				} else {
					window.scrollTo(0, 0);
				}
			}

			return {
				success: true,
				url: fullPath
			};
		} finally {
			// Only clear if we're still the latest navigation, so a newer navigate
			// that set its own pending target isn't wiped by an older one finishing.
			if (this._navigationId === navId) {
				this._pendingTarget = null;
			}
		}
	}

	public async navigateByName(name: string, params: Record<string, string> = {}, options: INavigationOptions = {}): Promise<INavigationResult> {
		const path = buildPathFromRoute(this._routes, name, params);

		if (!path) {
			return {
				success: false,
				error: `Route with name '${name}' not found`
			};
		}

		return this.navigate(path, options);
	}

	public replace(path: string, data?: unknown): void {
		// Run the full pipeline with replace semantics so outlets render the
		// new location. (Pre-3.0, the patched replaceState fired a
		// NavigationEvent and outlets re-matched — replacing the URL without
		// committing a route left the view stale.)
		void this.navigate(path, { replace: true, data });
	}

	public back(): void {
		history.back();
	}

	public forward(): void {
		history.forward();
	}

	public go(delta: number): void {
		history.go(delta);
	}

	public async runDeactivationGuards(targetPath: string): Promise<boolean | string> {
		for (const match of this._currentMatches) {
			const guards = match.route.canDeactivate ?? [];

			for (const guard of guards) {
				const context = this.createGuardContext(match, {
					matches: this._currentMatches,
					params: this._contextService.getCurrentParams(),
					isExactMatch: true
				});
				context.targetPath = targetPath;

				const result = await this.executeGuard(guard, 'canDeactivate', context);

				if (result !== true) {
					return result;
				}
			}
		}

		return true;
	}

	public async runGuards(matchResult: IRouteMatchResult): Promise<boolean | string> {
		for (const match of matchResult.matches) {
			const guards = match.route.canActivate ?? [];

			for (const guard of guards) {
				const context = this.createGuardContext(match, matchResult);
				const result = await this.executeGuard(guard, 'canActivate', context);

				if (result !== true) {
					return result;
				}
			}
		}

		return true;
	}

	private async executeGuard(guard: IRouteGuard, method: 'canActivate' | 'canDeactivate', context: IGuardContext): Promise<boolean | string> {
		const fn = guard[method];
		if (!fn) {
			return true;
		}

		try {
			const result: AsyncGuardResult = fn.call(guard, context);
			return result instanceof Promise ? await result : result;
		} catch (error) {
			console.error(`Guard error:`, error);
			return false;
		}
	}

	private createGuardContext(match: IRouteMatch, matchResult: IRouteMatchResult): IGuardContext {
		return {
			route: match,
			matchedRoutes: matchResult.matches,
			params: matchResult.params,
			// Reflect the navigation TARGET (history isn't updated until after
			// guards/resolvers run), not the current location.
			queryParams: this.targetQueryParams(),
			targetPath: this.targetPathname(),
			currentPath: window.location.pathname,
			data: match.route.data
		};
	}

	/**
	 * Run the resolvers for a match result. The router pipeline (navigate /
	 * initial navigation / popstate) calls this exactly once per navigation —
	 * call it directly only when driving the router manually.
	 *
	 * Resolver output is collected locally and committed to the route context
	 * atomically at the end, only when `isCurrent()` still holds. Writing
	 * incrementally across the awaits would let a superseded (or failed)
	 * navigation clear or overwrite the resolved data of the navigation that
	 * actually won.
	 */
	public async runResolvers(matchResult: IRouteMatchResult, isCurrent: () => boolean = () => true): Promise<{ success: boolean; error?: string }> {
		const collected: Array<{ depth: number; data: Record<string, unknown> }> = [];

		for (let depth = 0; depth < matchResult.matches.length; depth++) {
			const match = matchResult.matches[depth];
			const resolvers = match.route.resolve;

			if (!resolvers) {
				continue;
			}

			const resolvedData: Record<string, unknown> = {};
			const context = this.createResolverContext(match, matchResult);

			for (const [key, resolver] of Object.entries(resolvers)) {
				try {
					const result = await this.executeResolver(resolver, context);
					resolvedData[key] = result;
				} catch (error) {
					console.error(`Resolver '${key}' failed:`, error);
					return {
						success: false,
						error: `Resolver '${key}' failed: ${error instanceof Error ? error.message : String(error)}`
					};
				}
			}

			collected.push({ depth, data: resolvedData });
		}

		if (!isCurrent()) {
			return { success: false, error: 'Navigation superseded' };
		}

		this._contextService.clearResolvedData();
		for (const { depth, data } of collected) {
			this._contextService.setResolvedData(depth, data);
		}

		return { success: true };
	}

	/**
	 * Full pipeline for browser back/forward (and synthetic popstate): the
	 * URL has already changed, so a guard block reverts history to the
	 * previous path instead of preventing the URL change.
	 */
	private async handlePopState(event: PopStateEvent): Promise<void> {
		const navId = ++this._navigationId;
		const targetPath = `${window.location.pathname}${window.location.search}`;
		const previousPath = this._currentPath;

		const deactivateResult = await this.runDeactivationGuards(targetPath);
		if (this._navigationId !== navId) {
			return;
		}

		if (deactivateResult !== true) {
			if (typeof deactivateResult === 'string') {
				await this.navigate(deactivateResult, { replace: true, skipGuards: true });
			} else {
				history.replaceState(event.state, '', previousPath);
			}
			return;
		}

		const matchResult = this.matchPath(window.location.pathname);

		if (matchResult.redirectTo) {
			await this.navigate(matchResult.redirectTo, { replace: true });
			return;
		}

		if (matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);
			if (this._navigationId !== navId) {
				return;
			}
			if (guardResult !== true) {
				if (typeof guardResult === 'string') {
					await this.navigate(guardResult, { replace: true, skipGuards: true });
				} else {
					// Blocked: restore the previous URL without committing.
					history.replaceState(event.state, '', previousPath);
				}
				return;
			}

			const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
			if (this._navigationId !== navId) {
				return;
			}
			if (!resolverResult.success) {
				this._currentPath = targetPath;
				this.commit({ matches: [], params: {}, isExactMatch: false });
				return;
			}
		}

		this._currentPath = targetPath;
		this.commit(matchResult);

		// Notify listeners (router links, tabs, …) that the location changed.
		const navigationEvent = new CustomEvent('NavigationEvent', {
			detail: routerStateEvent('push', event.state, '', window.location.pathname)
		});
		window.dispatchEvent(navigationEvent);
	}

	private async executeResolver(resolver: IRouteResolver, context: IResolverContext): Promise<unknown> {
		const result = resolver.resolve(context);
		return result instanceof Promise ? await result : result;
	}

	private createResolverContext(match: IRouteMatch, matchResult: IRouteMatchResult): IResolverContext {
		return {
			route: match,
			matchedRoutes: matchResult.matches,
			params: matchResult.params,
			// Reflect the navigation TARGET, not the current location.
			queryParams: this.targetQueryParams(),
			targetPath: this.targetPathname()
		};
	}
}
