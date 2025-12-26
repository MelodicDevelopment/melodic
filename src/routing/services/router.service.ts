import { Injectable } from '../../injection/decorators/injectable.decorator';
import type { IRouterEventState } from '../interfaces/irouter-event-state.interface';
import type { IRouteGuard } from '../interfaces/iroute-guard.interface';
import type { IRouteResolver } from '../interfaces/iroute-resolver.interface';
import type { RouterStateEvent } from '../types/router-state-event.type';
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

// monkey-patch history methods to emit NavigationEvent
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
	private _route: IRouterEventState | undefined;
	private _routes: IRoute[] = [];
	private _contextService: RouteContextService;
	private _currentMatches: IRouteMatch[] = [];
	private _resolversExecutedForPath: string | null = null;
	private _currentPath: string = `${window.location.pathname}${window.location.search}`;

	constructor() {
		this._contextService = new RouteContextService();

		window.addEventListener('NavigationEvent', (event: Event) => {
			this._route = ((event as CustomEvent).detail as PopStateEvent).state;
		});

		window.addEventListener('popstate', (event: PopStateEvent) => {
			void this.handlePopState(event);
		});
	}

	setRoutes(routes: IRoute[]): void {
		this._routes = routes;
	}

	getRoutes(): IRoute[] {
		return this._routes;
	}

	getContextService(): RouteContextService {
		return this._contextService;
	}

	getRoute(): IRouterEventState | undefined {
		return this._route;
	}

	getParams(): Record<string, string> {
		return this._contextService.getCurrentParams();
	}

	getParam(name: string): string | undefined {
		return this._contextService.getCurrentParams()[name];
	}

	getQueryParams(): URLSearchParams {
		return new URLSearchParams(window.location.search);
	}

	getCurrentMatches(): IRouteMatch[] {
		return [...this._currentMatches];
	}

	getRouteData(depth?: number): Record<string, unknown> {
		return this._contextService.getMergedRouteData(depth);
	}

	getResolvedData(depth?: number): Record<string, unknown> {
		return this._contextService.getMergedResolvedData(depth);
	}

	matchPath(path: string): IRouteMatchResult {
		return matchRouteTree(this._routes, path);
	}

	setCurrentMatches(result: IRouteMatchResult): void {
		this._currentMatches = result.matches;
		this._contextService.setMatchResult(result);
	}

	async runResolvers(matchResult: IRouteMatchResult): Promise<{ success: boolean; error?: string }> {
		const currentPath = `${window.location.pathname}${window.location.search}`;

		if (this._resolversExecutedForPath === currentPath) {
			this._resolversExecutedForPath = null; // Clear for next navigation
			return { success: true };
		}

		const result = await this.runResolversInternal(matchResult);
		this._resolversExecutedForPath = null; // Clear after execution
		return result;
	}

	async navigate(path: string, options: INavigationOptions = {}): Promise<INavigationResult> {
		const { data, replace = false, queryParams, skipGuards = false, skipResolvers = false } = options;

		let fullPath = path;
		if (queryParams && Object.keys(queryParams).length > 0) {
			const params = new URLSearchParams(queryParams);
			fullPath = `${path}?${params.toString()}`;
		}

		if (!skipGuards && this._currentMatches.length > 0) {
			const deactivateResult = await this.runDeactivationGuards(fullPath);
			if (deactivateResult !== true) {
				if (typeof deactivateResult === 'string') {
					return this.navigate(deactivateResult, { ...options, skipGuards: true });
				}
				return {
					success: false,
					error: 'Navigation blocked by guard'
				};
			}
		}

		const matchResult = this.matchPath(path);

		if (matchResult.redirectTo) {
			return this.navigate(matchResult.redirectTo, { ...options, replace: true });
		}

		if (!skipGuards && matchResult.matches.length > 0) {
			const guardResult = await this.runGuards(matchResult);

			if (guardResult !== true) {
				if (typeof guardResult === 'string') {
					return this.navigate(guardResult, { ...options, skipGuards: true });
				}
				return {
					success: false,
					error: 'Navigation blocked by guard'
				};
			}
		}

		if (!skipResolvers && matchResult.matches.length > 0) {
			const resolverResult = await this.runResolversInternal(matchResult);

			if (!resolverResult.success) {
				return {
					success: false,
					error: resolverResult.error ?? 'Navigation blocked by resolver'
				};
			}

			this._resolversExecutedForPath = fullPath;
		}

		if (replace) {
			history.replaceState(data, '', fullPath);
		} else {
			history.pushState(data, '', fullPath);
		}
		this._currentPath = fullPath;

		return {
			success: true,
			url: fullPath
		};
	}

	async navigateByName(name: string, params: Record<string, string> = {}, options: INavigationOptions = {}): Promise<INavigationResult> {
		const path = buildPathFromRoute(this._routes, name, params);

		if (!path) {
			return {
				success: false,
				error: `Route with name '${name}' not found`
			};
		}

		return this.navigate(path, options);
	}

	replace(path: string, data?: unknown): void {
		history.replaceState(data, '', path);
		this._currentPath = `${window.location.pathname}${window.location.search}`;
	}

	back(): void {
		history.back();
	}

	forward(): void {
		history.forward();
	}

	go(delta: number): void {
		history.go(delta);
	}

	async runDeactivationGuards(targetPath: string): Promise<boolean | string> {
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

	private async runGuards(matchResult: IRouteMatchResult): Promise<boolean | string> {
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
			queryParams: new URLSearchParams(window.location.search),
			targetPath: window.location.pathname,
			currentPath: window.location.pathname,
			data: match.route.data
		};
	}

	private async runResolversInternal(matchResult: IRouteMatchResult): Promise<{ success: boolean; error?: string }> {
		this._contextService.clearResolvedData();

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

			this._contextService.setResolvedData(depth, resolvedData);
		}

		return { success: true };
	}

	private async handlePopState(event: PopStateEvent): Promise<void> {
		const targetPath = `${window.location.pathname}${window.location.search}`;
		const guardResult = await this.runDeactivationGuards(targetPath);

		if (guardResult !== true) {
			if (typeof guardResult === 'string') {
				await this.navigate(guardResult, { replace: true, skipGuards: true });
			} else {
				history.replaceState(event.state, '', this._currentPath);
			}
			return;
		}

		this._currentPath = targetPath;
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
			queryParams: new URLSearchParams(window.location.search),
			targetPath: window.location.pathname
		};
	}
}
