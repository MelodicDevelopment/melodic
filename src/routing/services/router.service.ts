import { Injectable } from '../../injection/decorators/injectable.decorator';
import type { IRouterEventState } from '../interfaces/irouter-event-state.interface';
import type { IRoute, IRouteMatch, IRouteMatchResult } from '../interfaces/iroute.interface';
import type { IGuardContext, IRouteGuard, AsyncGuardResult } from '../interfaces/iroute-guard.interface';
import type { IResolverContext, IRouteResolver } from '../interfaces/iroute-resolver.interface';
import type { RouterStateEvent } from '../types/router-state-event.type';
import { matchRouteTree, buildPathFromRoute } from '../classes/route-matcher.class';
import { RouteContextService } from './route-context.service';

/**
 * Navigation options for programmatic navigation.
 */
export interface INavigationOptions {
	/** Custom data to pass with the navigation */
	data?: unknown;

	/** Replace current history entry instead of pushing */
	replace?: boolean;

	/** Query parameters to append to the URL */
	queryParams?: Record<string, string>;

	/** Skip guard checks (use with caution) */
	skipGuards?: boolean;

	/** Skip resolver execution (use with caution) */
	skipResolvers?: boolean;
}

/**
 * Navigation result returned from navigation attempts.
 */
export interface INavigationResult {
	/** Whether navigation was successful */
	success: boolean;

	/** The final URL navigated to (may differ if redirected) */
	url?: string;

	/** Error message if navigation failed */
	error?: string;

	/** If blocked by guard, the redirect path */
	redirectTo?: string;
}

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

// Wrap history methods to emit navigation events
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
	singleton: true
})
export class RouterService {
	#route: IRouterEventState | undefined;
	#routes: IRoute[] = [];
	#contextService: RouteContextService;
	#currentMatches: IRouteMatch[] = [];

	constructor() {
		this.#contextService = new RouteContextService();

		window.addEventListener('NavigationEvent', (event: Event) => {
			this.#route = ((event as CustomEvent).detail as PopStateEvent).state;
		});

		window.addEventListener('popstate', (event: PopStateEvent) => {
			const navigationEvent = new CustomEvent('NavigationEvent', {
				detail: routerStateEvent('push', event.state, '', window.location.pathname)
			});
			window.dispatchEvent(navigationEvent);
		});
	}

	/**
	 * Register the root route configuration.
	 */
	setRoutes(routes: IRoute[]): void {
		this.#routes = routes;
	}

	/**
	 * Get the registered routes.
	 */
	getRoutes(): IRoute[] {
		return this.#routes;
	}

	/**
	 * Get the route context service for nested outlet communication.
	 */
	getContextService(): RouteContextService {
		return this.#contextService;
	}

	/**
	 * Get the current route state.
	 */
	getRoute(): IRouterEventState | undefined {
		return this.#route;
	}

	/**
	 * Get current route parameters from all matched routes.
	 */
	getParams(): Record<string, string> {
		return this.#contextService.getCurrentParams();
	}

	/**
	 * Get a specific route parameter.
	 */
	getParam(name: string): string | undefined {
		return this.#contextService.getCurrentParams()[name];
	}

	/**
	 * Get current query parameters.
	 */
	getQueryParams(): URLSearchParams {
		return new URLSearchParams(window.location.search);
	}

	/**
	 * Get the current matched route stack.
	 */
	getCurrentMatches(): IRouteMatch[] {
		return [...this.#currentMatches];
	}

	/**
	 * Get merged route data from all matched routes.
	 * @param depth Optional depth to limit how far up the route tree to merge
	 */
	getRouteData(depth?: number): Record<string, unknown> {
		return this.#contextService.getMergedRouteData(depth);
	}

	/**
	 * Get resolved data from all matched routes.
	 * @param depth Optional depth to limit how far up the route tree to merge
	 */
	getResolvedData(depth?: number): Record<string, unknown> {
		return this.#contextService.getMergedResolvedData(depth);
	}

	/**
	 * Match a path against the route configuration.
	 */
	matchPath(path: string): IRouteMatchResult {
		return matchRouteTree(this.#routes, path);
	}

	/**
	 * Update the current match result (called by router outlet after matching).
	 */
	setCurrentMatches(result: IRouteMatchResult): void {
		this.#currentMatches = result.matches;
		this.#contextService.setMatchResult(result);
	}

	/**
	 * Navigate to a path with optional configuration.
	 */
	async navigate(path: string, options: INavigationOptions = {}): Promise<INavigationResult> {
		const { data, replace = false, queryParams, skipGuards = false, skipResolvers = false } = options;

		// Build full URL with query params
		let fullPath = path;
		if (queryParams && Object.keys(queryParams).length > 0) {
			const params = new URLSearchParams(queryParams);
			fullPath = `${path}?${params.toString()}`;
		}

		// Match the route to check guards
		const matchResult = this.matchPath(path);

		// Handle redirects from route config
		if (matchResult.redirectTo) {
			return this.navigate(matchResult.redirectTo, { ...options, replace: true });
		}

		// Run guards if not skipped
		if (!skipGuards && matchResult.matches.length > 0) {
			const guardResult = await this.#runGuards(matchResult);

			if (guardResult !== true) {
				if (typeof guardResult === 'string') {
					// Redirect
					return this.navigate(guardResult, { ...options, skipGuards: true });
				}
				return {
					success: false,
					error: 'Navigation blocked by guard'
				};
			}
		}

		// Run resolvers if not skipped
		if (!skipResolvers && matchResult.matches.length > 0) {
			const resolverResult = await this.#runResolvers(matchResult);

			if (!resolverResult.success) {
				return {
					success: false,
					error: resolverResult.error ?? 'Navigation blocked by resolver'
				};
			}
		}

		// Perform the navigation
		if (replace) {
			history.replaceState(data, '', fullPath);
		} else {
			history.pushState(data, '', fullPath);
		}

		return {
			success: true,
			url: fullPath
		};
	}

	/**
	 * Navigate by route name with parameters.
	 */
	async navigateByName(name: string, params: Record<string, string> = {}, options: INavigationOptions = {}): Promise<INavigationResult> {
		const path = buildPathFromRoute(this.#routes, name, params);

		if (!path) {
			return {
				success: false,
				error: `Route with name '${name}' not found`
			};
		}

		return this.navigate(path, options);
	}

	/**
	 * Replace current history entry (simple version without guards/resolvers).
	 */
	replace(path: string, data?: unknown): void {
		history.replaceState(data, '', path);
	}

	/**
	 * Go back in history.
	 */
	back(): void {
		history.back();
	}

	/**
	 * Go forward in history.
	 */
	forward(): void {
		history.forward();
	}

	/**
	 * Go to a specific point in history.
	 */
	go(delta: number): void {
		history.go(delta);
	}

	/**
	 * Run activation guards for matched routes.
	 */
	async #runGuards(matchResult: IRouteMatchResult): Promise<boolean | string> {
		for (const match of matchResult.matches) {
			const guards = match.route.canActivate ?? [];

			for (const guard of guards) {
				const context = this.#createGuardContext(match, matchResult);
				const result = await this.#executeGuard(guard, 'canActivate', context);

				if (result !== true) {
					return result;
				}
			}
		}

		return true;
	}

	/**
	 * Run deactivation guards for current routes.
	 */
	async runDeactivationGuards(targetPath: string): Promise<boolean | string> {
		for (const match of this.#currentMatches) {
			const guards = match.route.canDeactivate ?? [];

			for (const guard of guards) {
				const context = this.#createGuardContext(match, {
					matches: this.#currentMatches,
					params: this.#contextService.getCurrentParams(),
					isExactMatch: true
				});
				context.targetPath = targetPath;

				const result = await this.#executeGuard(guard, 'canDeactivate', context);

				if (result !== true) {
					return result;
				}
			}
		}

		return true;
	}

	/**
	 * Execute a single guard.
	 */
	async #executeGuard(guard: IRouteGuard, method: 'canActivate' | 'canDeactivate', context: IGuardContext): Promise<boolean | string> {
		const fn = guard[method];
		if (!fn) return true;

		try {
			const result: AsyncGuardResult = fn.call(guard, context);
			return result instanceof Promise ? await result : result;
		} catch (error) {
			console.error(`Guard error:`, error);
			return false;
		}
	}

	/**
	 * Create guard context.
	 */
	#createGuardContext(match: IRouteMatch, matchResult: IRouteMatchResult): IGuardContext {
		return {
			route: match,
			matchedRoutes: matchResult.matches,
			params: matchResult.params,
			queryParams: new URLSearchParams(window.location.search),
			targetPath: window.location.pathname,
			currentPath: window.location.pathname,
			data: match.route.data
		};
	}

	/**
	 * Run resolvers for matched routes.
	 * Resolvers run after guards pass, and if any resolver fails, navigation is blocked.
	 */
	async #runResolvers(matchResult: IRouteMatchResult): Promise<{ success: boolean; error?: string }> {
		// Clear previous resolved data
		this.#contextService.clearResolvedData();

		for (let depth = 0; depth < matchResult.matches.length; depth++) {
			const match = matchResult.matches[depth];
			const resolvers = match.route.resolve;

			if (!resolvers) continue;

			const resolvedData: Record<string, unknown> = {};
			const context = this.#createResolverContext(match, matchResult);

			for (const [key, resolver] of Object.entries(resolvers)) {
				try {
					const result = await this.#executeResolver(resolver, context);
					resolvedData[key] = result;
				} catch (error) {
					console.error(`Resolver '${key}' failed:`, error);
					return {
						success: false,
						error: `Resolver '${key}' failed: ${error instanceof Error ? error.message : String(error)}`
					};
				}
			}

			// Store resolved data for this depth
			this.#contextService.setResolvedData(depth, resolvedData);
		}

		return { success: true };
	}

	/**
	 * Execute a single resolver.
	 */
	async #executeResolver(resolver: IRouteResolver, context: IResolverContext): Promise<unknown> {
		const result = resolver.resolve(context);
		return result instanceof Promise ? await result : result;
	}

	/**
	 * Create resolver context.
	 */
	#createResolverContext(match: IRouteMatch, matchResult: IRouteMatchResult): IResolverContext {
		return {
			route: match,
			matchedRoutes: matchResult.matches,
			params: matchResult.params,
			queryParams: new URLSearchParams(window.location.search),
			targetPath: window.location.pathname
		};
	}
}
