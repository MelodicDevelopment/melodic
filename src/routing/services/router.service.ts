import { Injectable } from '../../injection/decorators/injectable.decorator';
import { Injector } from '../../injection/classes/injection-engine.class';
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
import type { INavigationEvent, NavigationEventType } from '../interfaces/inavigation-event.interface';
import type { IRoute } from '../interfaces/iroute.interface';
import type { IRouteMatch } from '../interfaces/iroute-match.interface';
import type { IRouteMatchResult } from '../interfaces/iroute-match-result.interface';
import { matchRouteTree } from '../functions/match-route-tree.function';
import { buildPathFromRoute } from '../functions/build-path-from-route.function';
import { installHistoryEvents, routerStateEvent } from '../functions/install-history-events.function';
import { appendQueryParams, parseUrlParts } from '../functions/url-parts.function';

/**
 * In-flight / completed lazy loads, keyed by route so concurrent navigations
 * (and re-navigations after a failure that was later fixed) share one load.
 */
const childrenLoads = new WeakMap<IRoute, Promise<{ routes: IRoute[] }>>();
const componentLoads = new WeakMap<IRoute, Promise<unknown>>();

/** Upper bound on successive lazy-children loads for one navigation. */
const MAX_LAZY_LOADS = 64;

/**
 * Upper bound on redirect hops (route `redirectTo` and guard redirects
 * combined) for one navigation. Without it, `{a → /b, b → /a}` — or a route
 * redirecting to itself — recurses through microtasks until the heap dies.
 */
const MAX_REDIRECTS = 10;

/** Key under which the router stamps its history index onto `history.state`. */
const HISTORY_INDEX_KEY = '__melodicHistoryIndex';

function loadRouteChildren(route: IRoute): Promise<{ routes: IRoute[] }> {
	let pending = childrenLoads.get(route);
	if (!pending) {
		pending = Promise.resolve().then(() => route.loadChildren!());
		pending.catch(() => childrenLoads.delete(route));
		childrenLoads.set(route, pending);
	}
	return pending;
}

function loadRouteComponent(route: IRoute): Promise<unknown> {
	let pending = componentLoads.get(route);
	if (!pending) {
		pending = Promise.resolve().then(() => route.loadComponent!());
		pending.catch(() => componentLoads.delete(route));
		componentLoads.set(route, pending);
	}
	return pending;
}

interface IResolvedMatch {
	result: IRouteMatchResult;
	/** Set when a lazy load failed; the navigation must not commit `result`. */
	error?: string;
	superseded?: boolean;
}

/**
 * Carried across redirect hops so the chain can be bounded and reported, and
 * so a deactivation guard that redirects is not asked the same question again
 * on every hop.
 */
interface IRedirectState {
	chain: string[];
	skipDeactivation: boolean;
}

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
	private _params: Signal<Record<string, string>>;
	private _queryParams: Signal<URLSearchParams>;
	private _resolvedData: Signal<Record<string, unknown>>;
	private _events: Signal<INavigationEvent | null>;
	private _navigationListener: EventListener;
	private _popStateListener: (event: PopStateEvent) => void;
	// Our belief about which history entry is current, so a blocked back/forward
	// can step back by the right delta instead of overwriting the wrong entry.
	private _historyIndex = 0;
	private _ignorePopStates = 0;
	private _scrollPositions = new Map<number, { x: number; y: number }>();
	private _scrollRestoration = true;
	private _previousScrollRestoration: ScrollRestoration | null = null;

	constructor() {
		installHistoryEvents();

		// Resolve through the injector so `Injector.get(RouteContextService)`
		// and `router.getContextService()` are the same object. (Constructing
		// one here left consumers reading an empty context service.)
		this._contextService = Injector.has(RouteContextService) ? Injector.get(RouteContextService) : new RouteContextService();
		this._committedRoute = signal<IRouteMatchResult | null>(null);
		this._params = signal<Record<string, string>>({});
		this._queryParams = signal<URLSearchParams>(new URLSearchParams(window.location.search));
		this._resolvedData = signal<Record<string, unknown>>({});
		this._events = signal<INavigationEvent | null>(null);

		this._historyIndex = this.readHistoryIndex(history.state) ?? 0;
		this.enableScrollRestoration(true);

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

	/**
	 * Route params of the committed route, as a signal. Reading it in a
	 * component template re-renders that component when the params change —
	 * the supported way to react to `/users/1 → /users/2`, where the same
	 * component stays mounted and `onCreate` does not run again.
	 */
	public get params(): Signal<Record<string, string>> {
		return this._params;
	}

	/** Query params of the committed route, as a signal. */
	public get queryParams(): Signal<URLSearchParams> {
		return this._queryParams;
	}

	/** Merged resolver output for the committed route, as a signal. */
	public get resolvedData(): Signal<Record<string, unknown>> {
		return this._resolvedData;
	}

	/**
	 * Stream of navigation lifecycle events as a signal holding the most
	 * recent one (null before the first navigation). Subscribe for progress
	 * bars, analytics or failure toasts:
	 *
	 * ```typescript
	 * router.events.subscribe((event) => {
	 *   if (event?.type === 'start') showProgress();
	 *   if (event?.type === 'end' || event?.type === 'error') hideProgress();
	 * });
	 * ```
	 */
	public get events(): Signal<INavigationEvent | null> {
		return this._events;
	}

	/** Remove the service's window listeners (tests / teardown). */
	public destroy(): void {
		window.removeEventListener('NavigationEvent', this._navigationListener);
		window.removeEventListener('popstate', this._popStateListener);

		if (this._previousScrollRestoration !== null && 'scrollRestoration' in history) {
			history.scrollRestoration = this._previousScrollRestoration;
			this._previousScrollRestoration = null;
		}
	}

	/**
	 * Take over scroll position handling for back/forward navigation. On by
	 * default; `provideRouter(routes, { scrollRestoration: false })` leaves the
	 * browser's own restoration in place.
	 */
	public enableScrollRestoration(enabled: boolean): void {
		this._scrollRestoration = enabled;

		if (!('scrollRestoration' in history)) {
			return;
		}

		if (enabled) {
			if (this._previousScrollRestoration === null) {
				this._previousScrollRestoration = history.scrollRestoration;
			}
			history.scrollRestoration = 'manual';
		} else if (this._previousScrollRestoration !== null) {
			history.scrollRestoration = this._previousScrollRestoration;
			this._previousScrollRestoration = null;
		}
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

	private emit(type: NavigationEventType, id: number, url: string, trigger: INavigationEvent['trigger'], extra: Partial<INavigationEvent> = {}): void {
		this._events.set({ type, id, url, trigger, ...extra });
	}

	/**
	 * Match a path AND load whatever lazy configuration the matched chain
	 * needs (`loadChildren` on a matched parent, `loadComponent` on any
	 * matched route), re-matching after each children load so the chain
	 * continues into the newly loaded routes.
	 *
	 * Loading here — inside the navigation pipeline, before guards and
	 * resolvers — is what makes lazy child guards enforceable: outlets only
	 * ever render a chain the service has fully matched and guarded.
	 */
	private async resolveMatch(path: string, isCurrent: () => boolean): Promise<IResolvedMatch> {
		for (let loads = 0; loads <= MAX_LAZY_LOADS; loads++) {
			const result = this.matchPath(path);

			if (result.redirectTo) {
				return { result };
			}

			const last = result.matches[result.matches.length - 1];

			if (last && last.route.loadChildren && !last.route.children) {
				try {
					const module = await loadRouteChildren(last.route);
					last.route.children = module.routes;
				} catch (error) {
					console.error('Failed to load child routes:', error);
					return {
						result,
						error: `Failed to load child routes: ${error instanceof Error ? error.message : String(error)}`
					};
				}

				if (!isCurrent()) {
					return { result, superseded: true };
				}

				continue;
			}

			const pendingComponents = result.matches.filter((match) => match.route.loadComponent).map((match) => loadRouteComponent(match.route));

			if (pendingComponents.length > 0) {
				try {
					await Promise.all(pendingComponents);
				} catch (error) {
					console.error('Failed to load component:', error);
					return {
						result,
						error: `Failed to load component: ${error instanceof Error ? error.message : String(error)}`
					};
				}

				if (!isCurrent()) {
					return { result, superseded: true };
				}
			}

			return { result };
		}

		return { result: this.matchPath(path), error: `Route '${path}' exceeded ${MAX_LAZY_LOADS} lazy child loads` };
	}

	/** Split a URL into its pathname / search / hash parts. */
	private parseUrl(url: string): { pathname: string; search: string; hash: string } {
		return parseUrlParts(url);
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
		this.publishRouteState(result);
		this._committedRoute.set(result);
	}

	/** Keep the reactive params/query/resolved-data mirrors in step. */
	private publishRouteState(result: IRouteMatchResult): void {
		this._params.set({ ...result.params });
		this._queryParams.set(this.targetQueryParams());
		this._resolvedData.set(this._contextService.getMergedResolvedData());
	}

	/**
	 * Run the full pipeline (match → guards → resolvers → commit) for the
	 * CURRENT location without touching history. Called once by the root
	 * outlet on startup; also re-run when the root outlet's routes change.
	 */
	public async initialNavigation(): Promise<INavigationResult> {
		const navId = ++this._navigationId;
		const currentUrl = `${window.location.pathname}${window.location.search}`;
		this.emit('start', navId, currentUrl, 'initial');

		const resolved = await this.resolveMatch(window.location.pathname, () => this._navigationId === navId);
		if (resolved.superseded || this._navigationId !== navId) {
			this.emit('superseded', navId, currentUrl, 'initial');
			return { success: false, error: 'Navigation superseded' };
		}
		const matchResult = resolved.result;

		if (matchResult.redirectTo) {
			if (this.normalizePath(window.location.pathname) !== this.normalizePath(matchResult.redirectTo)) {
				this.emit('redirect', navId, currentUrl, 'initial', { redirectTo: matchResult.redirectTo });
				return this.navigateInternal(matchResult.redirectTo, { replace: true }, { chain: [currentUrl], skipDeactivation: true });
			}

			const message = `Route '${currentUrl}' redirects to itself`;
			console.error(`[Melodic] ${message}`);
			this.emit('error', navId, currentUrl, 'initial', { error: message });
			this.commit({ matches: [], params: {}, isExactMatch: false });
			return { success: false, error: message };
		}

		if (resolved.error) {
			// Lazy load failed: render the 404 view rather than a blank page.
			this.commit({ matches: [], params: {}, isExactMatch: false });
			this.emit('error', navId, currentUrl, 'initial', { error: resolved.error });
			return { success: false, error: resolved.error };
		}

		if (matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);
			if (this._navigationId !== navId) {
				this.emit('superseded', navId, currentUrl, 'initial');
				return { success: false, error: 'Navigation superseded' };
			}
			if (guardResult !== true) {
				if (typeof guardResult === 'string') {
					this.emit('redirect', navId, currentUrl, 'initial', { redirectTo: guardResult });
					return this.navigateInternal(guardResult, { replace: true }, { chain: [currentUrl], skipDeactivation: true });
				}
				this.emit('blocked', navId, currentUrl, 'initial', { error: 'Navigation blocked by guard' });
				return { success: false, error: 'Navigation blocked by guard' };
			}

			const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
			if (this._navigationId !== navId) {
				this.emit('superseded', navId, currentUrl, 'initial');
				return { success: false, error: 'Navigation superseded' };
			}
			if (!resolverResult.success) {
				// Commit an empty result so outlets render their 404 view
				// (mirrors the previous initial-load behavior).
				this.commit({ matches: [], params: {}, isExactMatch: false });
				const error = resolverResult.error ?? 'Navigation blocked by resolver';
				this.emit('error', navId, currentUrl, 'initial', { error });
				return { success: false, error };
			}
		}

		this._currentPath = currentUrl;
		this.commit(matchResult);
		this.emit('end', navId, currentUrl, 'initial', { result: matchResult });

		return { success: true, url: currentUrl };
	}

	public async navigate(path: string, options: INavigationOptions = {}): Promise<INavigationResult> {
		return this.navigateInternal(path, options, null);
	}

	/**
	 * @param redirect state carried across redirect hops. `null` for a fresh
	 *   navigation. Redirect hops never skip the target's activation guards —
	 *   only the deactivation guards already answered earlier in the chain.
	 */
	private async navigateInternal(path: string, options: INavigationOptions, redirect: IRedirectState | null): Promise<INavigationResult> {
		const { data, replace = false, queryParams, skipGuards = false, skipResolvers = false, scrollToTop = true, onSameUrlNavigation = 'ignore' } = options;

		const fullPath = appendQueryParams(path, queryParams);
		const chain = redirect ? redirect.chain : [];
		const skipDeactivation = skipGuards || (redirect?.skipDeactivation ?? false);

		// Claim this navigation. Any newer navigate() bumps the id, letting this
		// one detect it was superseded after an await and bail before committing.
		const navId = ++this._navigationId;
		const { pathname, search, hash } = this.parseUrl(fullPath);
		this._pendingTarget = { pathname, queryParams: new URLSearchParams(search) };

		this.emit('start', navId, fullPath, 'imperative');

		if (chain.length >= MAX_REDIRECTS) {
			const error = `Redirect limit (${MAX_REDIRECTS}) exceeded: ${[...chain, fullPath].join(' → ')}`;
			console.error(`[Melodic] ${error}`);
			this._pendingTarget = null;
			this.emit('error', navId, fullPath, 'imperative', { error });
			return { success: false, error };
		}

		const superseded = (): INavigationResult => {
			this.emit('superseded', navId, fullPath, 'imperative');
			return { success: false, error: 'Navigation superseded' };
		};

		// Options a redirect hop inherits. `data`, `queryParams` and `replace`
		// belong to the navigation the user asked for, not to the destination a
		// guard picked — carrying them over produced `/login?tab=users`.
		const redirectOptions = (): INavigationOptions => ({
			replace,
			scrollToTop,
			skipResolvers
		});

		try {
			// Same-URL navigation: leave history and resolved data alone and
			// only re-apply scrolling, unless the caller asked for a reload.
			const targetUrl = `${pathname}${search}`;
			if (onSameUrlNavigation === 'ignore' && targetUrl === this._currentPath && this._committedRoute() !== null) {
				if (hash) {
					// A hash-only change still gets its own history entry.
					this.pushOrReplace(replace, data, fullPath);
					this.scrollToHash(hash.slice(1));
				} else if (scrollToTop) {
					window.scrollTo(0, 0);
				}

				this.emit('end', navId, fullPath, 'imperative', { result: this._committedRoute() ?? undefined });
				return { success: true, url: fullPath };
			}

			if (!skipDeactivation && this._currentMatches.length > 0) {
				const deactivateResult = await this.runDeactivationGuards(fullPath);
				if (this._navigationId !== navId) {
					return superseded();
				}
				if (deactivateResult !== true) {
					if (typeof deactivateResult === 'string') {
						this.emit('redirect', navId, fullPath, 'imperative', { redirectTo: deactivateResult });
						// The deactivation question was already answered: don't
						// ask it again on the hop (it would answer the same way
						// forever).
						return this.navigateInternal(deactivateResult, redirectOptions(), { chain: [...chain, fullPath], skipDeactivation: true });
					}
					this.emit('blocked', navId, fullPath, 'imperative', { error: 'Navigation blocked by guard' });
					return { success: false, error: 'Navigation blocked by guard' };
				}
			}

			const resolved = await this.resolveMatch(path, () => this._navigationId === navId);
			if (resolved.superseded || this._navigationId !== navId) {
				return superseded();
			}
			const matchResult = resolved.result;

			if (matchResult.redirectTo) {
				this.emit('redirect', navId, fullPath, 'imperative', { redirectTo: matchResult.redirectTo });

				// Honor the caller's original push/replace intent. Forcing
				// `replace: true` here would erase the previous unrelated history
				// entry: the source URL never gets pushed (this call returns
				// before reaching pushState below), so a replaceState on the
				// redirect target lands on whichever entry was current — i.e. the
				// page the user just came from — instead of becoming a new entry.
				return this.navigateInternal(matchResult.redirectTo, { ...options, queryParams: undefined }, { chain: [...chain, fullPath], skipDeactivation: true });
			}

			if (resolved.error) {
				this.emit('error', navId, fullPath, 'imperative', { error: resolved.error });
				return { success: false, error: resolved.error };
			}

			if (!skipGuards && matchResult.matches.length > 0) {
				const guardResult = await this.runGuards(matchResult);
				if (this._navigationId !== navId) {
					return superseded();
				}
				if (guardResult !== true) {
					if (typeof guardResult === 'string') {
						this.emit('redirect', navId, fullPath, 'imperative', { redirectTo: guardResult });
						// The redirect target runs its OWN activation guards: a
						// guard that redirects into a protected area must not be
						// able to open it.
						return this.navigateInternal(guardResult, redirectOptions(), { chain: [...chain, fullPath], skipDeactivation: true });
					}
					this.emit('blocked', navId, fullPath, 'imperative', { error: 'Navigation blocked by guard' });
					return { success: false, error: 'Navigation blocked by guard' };
				}
			}

			if (!skipResolvers && matchResult.matches.length > 0) {
				const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
				if (this._navigationId !== navId) {
					return superseded();
				}
				if (!resolverResult.success) {
					const error = resolverResult.error ?? 'Navigation blocked by resolver';
					this.emit('error', navId, fullPath, 'imperative', { error });
					return { success: false, error };
				}
			}

			// Params/context must be current before the history update fires
			// NavigationEvent…
			this.setCurrentMatches(matchResult);

			this.rememberScrollPosition();
			this.pushOrReplace(replace, data, fullPath);
			this._currentPath = targetUrl;

			// …while outlets must only render once window.location reflects the
			// target (components commonly read the location on create).
			this.publishRouteState(matchResult);
			this._committedRoute.set(matchResult);

			if (hash) {
				this.scrollToHash(hash.slice(1));
			} else if (scrollToTop) {
				window.scrollTo(0, 0);
			}

			this.emit('end', navId, fullPath, 'imperative', { result: matchResult });

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
			console.error(`[Melodic] ${method} guard for '${context.targetPath}' threw; treating as blocked:`, error);
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
	 * The resolvers of one route run concurrently (they are independent by
	 * construction — they receive the same context and cannot see each other's
	 * output); depths run in order so a child resolver can rely on its
	 * parent's data being committed first.
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

			const context = this.createResolverContext(match, matchResult);
			const entries = Object.entries(resolvers);

			const settled = await Promise.all(
				entries.map(async ([key, resolver]) => {
					try {
						return { key, value: await this.executeResolver(resolver, context) };
					} catch (error) {
						return { key, error };
					}
				})
			);

			const failure = settled.find((entry) => 'error' in entry);
			if (failure && 'error' in failure) {
				const error = failure.error;
				console.error(`[Melodic] Resolver '${failure.key}' for '${match.fullPath}' failed:`, error);
				return {
					success: false,
					error: `Resolver '${failure.key}' failed: ${error instanceof Error ? error.message : String(error)}`
				};
			}

			const resolvedData: Record<string, unknown> = {};
			for (const entry of settled) {
				resolvedData[entry.key] = (entry as { value: unknown }).value;
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
		// Our own corrective history.go() produces a popstate we must not treat
		// as a user navigation.
		if (this._ignorePopStates > 0) {
			this._ignorePopStates--;
			this._historyIndex = this.readHistoryIndex(event.state) ?? this._historyIndex;
			return;
		}

		const targetPath = `${window.location.pathname}${window.location.search}`;
		const previousPath = this._currentPath;
		const previousIndex = this._historyIndex;
		const targetIndex = this.readHistoryIndex(event.state);

		this.rememberScrollPosition(previousIndex);

		// A hash-only change (same pathname and query) is not a route change:
		// re-running guards and resolvers for it double-fetches and can even
		// bounce the user out of the page they are reading.
		if (targetPath === previousPath && this._committedRoute() !== null) {
			this._historyIndex = targetIndex ?? this._historyIndex;
			if (window.location.hash) {
				this.scrollToHash(window.location.hash.slice(1));
			} else {
				this.restoreScrollPosition(this._historyIndex);
			}
			return;
		}

		const navId = ++this._navigationId;
		this.emit('start', navId, targetPath, 'popstate');

		const revert = (): void => {
			if (targetIndex !== null) {
				// Step back to the entry we were on instead of overwriting the
				// entry the browser already moved to ([A,B,C] → [A,C,C]).
				this._ignorePopStates++;
				history.go(previousIndex - targetIndex);
			} else {
				history.replaceState(event.state, '', previousPath);
			}
		};

		const deactivateResult = await this.runDeactivationGuards(targetPath);
		if (this._navigationId !== navId) {
			this.emit('superseded', navId, targetPath, 'popstate');
			return;
		}

		if (deactivateResult !== true) {
			if (typeof deactivateResult === 'string') {
				this.emit('redirect', navId, targetPath, 'popstate', { redirectTo: deactivateResult });
				await this.navigateInternal(deactivateResult, { replace: true }, { chain: [targetPath], skipDeactivation: true });
			} else {
				this.emit('blocked', navId, targetPath, 'popstate', { error: 'Navigation blocked by guard' });
				revert();
			}
			return;
		}

		this._historyIndex = targetIndex ?? this._historyIndex;

		const resolved = await this.resolveMatch(window.location.pathname, () => this._navigationId === navId);
		if (resolved.superseded || this._navigationId !== navId) {
			this.emit('superseded', navId, targetPath, 'popstate');
			return;
		}
		const matchResult = resolved.result;

		if (matchResult.redirectTo) {
			this.emit('redirect', navId, targetPath, 'popstate', { redirectTo: matchResult.redirectTo });
			await this.navigateInternal(matchResult.redirectTo, { replace: true }, { chain: [targetPath], skipDeactivation: true });
			return;
		}

		if (resolved.error) {
			this._currentPath = targetPath;
			this.commit({ matches: [], params: {}, isExactMatch: false });
			this.emit('error', navId, targetPath, 'popstate', { error: resolved.error });
			return;
		}

		if (matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);
			if (this._navigationId !== navId) {
				this.emit('superseded', navId, targetPath, 'popstate');
				return;
			}
			if (guardResult !== true) {
				if (typeof guardResult === 'string') {
					this.emit('redirect', navId, targetPath, 'popstate', { redirectTo: guardResult });
					await this.navigateInternal(guardResult, { replace: true }, { chain: [targetPath], skipDeactivation: true });
				} else {
					this.emit('blocked', navId, targetPath, 'popstate', { error: 'Navigation blocked by guard' });
					this._historyIndex = previousIndex;
					revert();
				}
				return;
			}

			const resolverResult = await this.runResolvers(matchResult, () => this._navigationId === navId);
			if (this._navigationId !== navId) {
				this.emit('superseded', navId, targetPath, 'popstate');
				return;
			}
			if (!resolverResult.success) {
				this._currentPath = targetPath;
				this.commit({ matches: [], params: {}, isExactMatch: false });
				this.emit('error', navId, targetPath, 'popstate', { error: resolverResult.error ?? 'Navigation blocked by resolver' });
				return;
			}
		}

		this._currentPath = targetPath;
		this.commit(matchResult);

		if (window.location.hash) {
			this.scrollToHash(window.location.hash.slice(1));
		} else {
			this.restoreScrollPosition(this._historyIndex);
		}

		this.emit('end', navId, targetPath, 'popstate', { result: matchResult });

		// Notify listeners (router links, tabs, …) that the location changed.
		const navigationEvent = new CustomEvent('NavigationEvent', {
			detail: routerStateEvent('push', event.state, '', window.location.pathname)
		});
		window.dispatchEvent(navigationEvent);
	}

	private pushOrReplace(replace: boolean, data: unknown, fullPath: string): void {
		const index = replace ? this._historyIndex : this._historyIndex + 1;
		const state = this.stampHistoryIndex(data, index);

		if (replace) {
			history.replaceState(state, '', fullPath);
		} else {
			history.pushState(state, '', fullPath);
			// Forward entries are gone once a new one is pushed.
			for (const key of [...this._scrollPositions.keys()]) {
				if (key >= index) {
					this._scrollPositions.delete(key);
				}
			}
		}

		this._historyIndex = index;
	}

	/**
	 * Attach the router's history index to the caller's state. Objects (and
	 * absent state) are stamped; a primitive state is left untouched, which
	 * only costs precise back/forward reverting for that entry.
	 */
	private stampHistoryIndex(data: unknown, index: number): unknown {
		if (data === null || data === undefined) {
			return { [HISTORY_INDEX_KEY]: index };
		}

		if (typeof data === 'object') {
			return { ...(data as Record<string, unknown>), [HISTORY_INDEX_KEY]: index };
		}

		return data;
	}

	private readHistoryIndex(state: unknown): number | null {
		if (state && typeof state === 'object') {
			const value = (state as Record<string, unknown>)[HISTORY_INDEX_KEY];
			if (typeof value === 'number') {
				return value;
			}
		}

		return null;
	}

	private rememberScrollPosition(index: number = this._historyIndex): void {
		if (!this._scrollRestoration) {
			return;
		}

		this._scrollPositions.set(index, { x: window.scrollX, y: window.scrollY });
	}

	private restoreScrollPosition(index: number): void {
		if (!this._scrollRestoration) {
			return;
		}

		const position = this._scrollPositions.get(index);

		// Routed content renders asynchronously; restore after the outlet has
		// had a chance to put the page back.
		this.afterRender(() => window.scrollTo(position?.x ?? 0, position?.y ?? 0));
	}

	/**
	 * Scroll to `#id`, searching shadow roots. `document.getElementById` never
	 * sees an anchor inside a routed component's shadow DOM, which is where
	 * essentially all Melodic content lives.
	 */
	private scrollToHash(id: string): void {
		if (!id) {
			return;
		}

		this.afterRender(() => {
			const target = this.findDeep(document, id);
			target?.scrollIntoView();
		});
	}

	private findDeep(root: Document | ShadowRoot, id: string): Element | null {
		const direct = typeof root.getElementById === 'function' ? root.getElementById(id) : root.querySelector(`[id="${id.replace(/["\\]/g, '\\$&')}"]`);
		if (direct) {
			return direct;
		}

		for (const element of root.querySelectorAll('*')) {
			if (element.shadowRoot) {
				const found = this.findDeep(element.shadowRoot, id);
				if (found) {
					return found;
				}
			}
		}

		return null;
	}

	/** Run after the outlet has rendered the committed route. */
	private afterRender(fn: () => void): void {
		queueMicrotask(() => {
			if (typeof requestAnimationFrame === 'function') {
				requestAnimationFrame(fn);
			} else {
				fn();
			}
		});
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
