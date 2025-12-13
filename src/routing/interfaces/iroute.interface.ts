import type { IRouteGuard } from './iroute-guard.interface';
import type { IRouteResolver } from './iroute-resolver.interface';

/**
 * Route configuration interface with support for nested routes, guards, resolvers, and lazy loading.
 */
export interface IRoute {
	/** The path segment for this route (relative to parent) */
	path: string;

	/** The component selector to render for this route */
	component?: string;

	/** Redirect to another path instead of rendering a component */
	redirectTo?: string;

	/** Lazy load a component. Returns a promise that resolves when the component is registered. */
	loadComponent?: () => Promise<unknown>;

	/**
	 * Lazy load a route module containing child routes.
	 * The module should export a `routes` array of IRoute objects.
	 * This allows code-splitting of entire route hierarchies.
	 */
	loadChildren?: () => Promise<{ routes: IRoute[] }>;

	/** Child routes that will be rendered in a nested router-outlet */
	children?: IRoute[];

	/** Route guards that run before activation */
	canActivate?: IRouteGuard[];

	/** Route guards that run before deactivation */
	canDeactivate?: IRouteGuard[];

	/**
	 * Route resolvers that fetch data before activation.
	 * Keys are the names used to access resolved data.
	 * If any resolver fails, navigation is blocked.
	 */
	resolve?: Record<string, IRouteResolver>;

	/**
	 * Custom data associated with this route.
	 * Accessible via RouterService.getRouteData() in components.
	 */
	data?: Record<string, unknown>;

	/**
	 * Optional route name for programmatic navigation.
	 * e.g., router.navigateByName('settings.profile', { userId: '123' })
	 */
	name?: string;
}

/**
 * Extended route interface with pre-computed matcher and resolved children.
 * Used internally by the router.
 */
export interface IResolvedRoute extends IRoute {
	/** Full path from root (computed) */
	fullPath: string;

	/** Parsed route parameters */
	params: Record<string, string>;

	/** Parent route reference for traversal */
	parent?: IResolvedRoute;

	/** Whether children have been loaded (for lazy-loaded children) */
	childrenLoaded?: boolean;
}

/**
 * Represents a matched route with all ancestor information.
 */
export interface IRouteMatch {
	/** The matched route configuration */
	route: IRoute;

	/** Parsed URL parameters (e.g., { id: '123' } for path ':id') */
	params: Record<string, string>;

	/** The path segment that was matched */
	matchedPath: string;

	/** Remaining path to be matched by child routes */
	remainingPath: string;

	/** Full path from root to this route */
	fullPath: string;

	/** Child routes (resolved if lazy-loaded) */
	children?: IRoute[];
}

/**
 * Result of matching a full URL path against the route tree.
 */
export interface IRouteMatchResult {
	/** Array of matched routes from root to leaf */
	matches: IRouteMatch[];

	/** Combined params from all matched routes */
	params: Record<string, string>;

	/** Whether the full path was matched */
	isExactMatch: boolean;

	/** The final redirect path if any route redirects */
	redirectTo?: string;
}
