import type { IRouteMatchResult } from '../interfaces/iroute-match-result.interface';
import type { IRouteMatch } from '../interfaces/iroute-match.interface';
import type { IRoute } from '../interfaces/iroute.interface';
import { matchRouteLevel } from './match-route-level.function';

/**
 * Match a URL path against a route tree, supporting nested routes.
 */
export function matchRouteTree(routes: IRoute[], path: string, basePath: string = ''): IRouteMatchResult {
	const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
	const matches: IRouteMatch[] = [];
	const params: Record<string, string> = {};

	const result = matchRouteLevel(routes, normalizedPath, basePath, matches, params);

	return {
		matches: result.matches,
		params: result.params,
		isExactMatch: result.isExactMatch,
		redirectTo: result.redirectTo
	};
}
