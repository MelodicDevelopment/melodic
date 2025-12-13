import type { IRouteMatch } from './iroute.interface';

/**
 * Context passed to route resolvers.
 */
export interface IResolverContext {
	/** The route being resolved */
	route: IRouteMatch;

	/** All matched routes from root to current */
	matchedRoutes: IRouteMatch[];

	/** Combined route parameters */
	params: Record<string, string>;

	/** Query parameters from the URL */
	queryParams: URLSearchParams;

	/** The full URL path being navigated to */
	targetPath: string;
}

/**
 * Result type for resolvers - can be sync or async.
 */
export type ResolverResult<T> = T | Promise<T>;

/**
 * Route resolver interface.
 * Resolvers fetch data before a route is activated.
 * If a resolver throws or rejects, navigation is blocked.
 */
export interface IRouteResolver<T = unknown> {
	/**
	 * Resolve data for the route.
	 * Called after guards pass, before navigation completes.
	 */
	resolve(context: IResolverContext): ResolverResult<T>;
}

/**
 * Function-based resolver type for simpler resolver definitions.
 *
 * @example
 * const userResolver: ResolverFunction<User> = async (context) => {
 *   return await fetch(`/api/users/${context.params.userId}`).then(r => r.json());
 * };
 */
export type ResolverFunction<T = unknown> = (context: IResolverContext) => ResolverResult<T>;

/**
 * Helper to create a resolver from a function.
 *
 * @example
 * const routes = [{
 *   path: 'users/:userId',
 *   component: 'user-detail',
 *   resolve: {
 *     user: createResolver(async (ctx) => {
 *       return await fetchUser(ctx.params.userId);
 *     })
 *   }
 * }];
 */
export function createResolver<T>(fn: ResolverFunction<T>): IRouteResolver<T> {
	return {
		resolve: fn
	};
}
