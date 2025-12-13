import type { IRouteMatch } from './iroute.interface';

/**
 * Result of a route guard check.
 * - true: Allow navigation
 * - false: Block navigation
 * - string: Redirect to the specified path
 */
export type GuardResult = boolean | string;

/**
 * Async guard result - guards can return promises for async checks.
 */
export type AsyncGuardResult = GuardResult | Promise<GuardResult>;

/**
 * Context passed to route guards.
 */
export interface IGuardContext {
	/** The route being activated/deactivated */
	route: IRouteMatch;

	/** All matched routes from root to current */
	matchedRoutes: IRouteMatch[];

	/** Combined route parameters */
	params: Record<string, string>;

	/** Query parameters from the URL */
	queryParams: URLSearchParams;

	/** The full URL path being navigated to */
	targetPath: string;

	/** The current URL path (before navigation) */
	currentPath: string;

	/** Custom data from the route configuration */
	data?: Record<string, unknown>;
}

/**
 * Route guard interface.
 * Guards can be implemented as classes or simple functions.
 */
export interface IRouteGuard {
	/**
	 * Called before a route is activated.
	 * Return true to allow, false to block, or a string to redirect.
	 */
	canActivate?(context: IGuardContext): AsyncGuardResult;

	/**
	 * Called before leaving a route.
	 * Useful for confirming unsaved changes.
	 */
	canDeactivate?(context: IGuardContext): AsyncGuardResult;
}

/**
 * Function-based guard type for simpler guard definitions.
 *
 * @example
 * const authGuard: GuardFunction = (context) => {
 *   return isAuthenticated() || '/login';
 * };
 */
export type GuardFunction = (context: IGuardContext) => AsyncGuardResult;

/**
 * Helper to create a guard from a function.
 */
export function createGuard(fn: GuardFunction): IRouteGuard {
	return {
		canActivate: fn
	};
}

/**
 * Helper to create a deactivation guard from a function.
 */
export function createDeactivateGuard(fn: GuardFunction): IRouteGuard {
	return {
		canDeactivate: fn
	};
}
