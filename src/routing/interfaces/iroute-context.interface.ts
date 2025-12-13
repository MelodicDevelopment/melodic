import type { IRoute, IRouteMatch } from './iroute.interface';

/**
 * Context available to router outlets and routed components.
 * Provides information about the current route hierarchy.
 */
export interface IRouteContext {
	/** The depth of this outlet in the route hierarchy (0 = root) */
	depth: number;

	/** Routes configured for this outlet */
	routes: IRoute[];

	/** The matched route at this level */
	currentMatch?: IRouteMatch;

	/** All ancestor matches from root to current */
	ancestorMatches: IRouteMatch[];

	/** Combined params from all ancestor routes */
	params: Record<string, string>;

	/** The remaining path for child routes to match */
	remainingPath: string;

	/** The base path consumed by ancestor routes */
	basePath: string;

	/** Parent context (for nested outlets) */
	parent?: IRouteContext;
}

/**
 * Event dispatched when route context changes.
 */
export interface IRouteContextChangeEvent {
	/** The new context */
	context: IRouteContext;

	/** Previous context (if any) */
	previousContext?: IRouteContext;
}
