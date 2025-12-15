import { RouteMatcher } from '../classes/route-matcher.class';
import type { IRouteMatchResult } from '../interfaces/iroute-match-result.interface';
import type { IRouteMatch } from '../interfaces/iroute-match.interface';
import type { IRoute } from '../interfaces/iroute.interface';

export function matchRouteLevel(
	routes: IRoute[],
	remainingPath: string,
	basePath: string,
	accumulatedMatches: IRouteMatch[],
	accumulatedParams: Record<string, string>
): IRouteMatchResult {
	for (const route of routes) {
		const matcher = new RouteMatcher(route.path);

		if (route.redirectTo && route.path === remainingPath) {
			return {
				matches: accumulatedMatches,
				params: accumulatedParams,
				isExactMatch: false,
				redirectTo: route.redirectTo
			};
		}

		const exactMatch = matcher.parse(remainingPath);

		if (exactMatch !== null) {
			const fullPath = basePath ? `${basePath}/${route.path}` : route.path;
			const match: IRouteMatch = {
				route,
				params: exactMatch,
				matchedPath: route.path,
				remainingPath: '',
				fullPath,
				children: route.children
			};

			Object.assign(accumulatedParams, exactMatch);
			accumulatedMatches.push(match);

			return {
				matches: accumulatedMatches,
				params: accumulatedParams,
				isExactMatch: true
			};
		}

		if (route.children || route.loadChildren) {
			const prefixResult = matcher.parsePrefix(remainingPath);

			if (prefixResult && prefixResult.params !== null) {
				const fullPath = basePath ? `${basePath}/${prefixResult.matchedPath}` : prefixResult.matchedPath;

				const match: IRouteMatch = {
					route,
					params: prefixResult.params,
					matchedPath: prefixResult.matchedPath,
					remainingPath: prefixResult.remainingPath,
					fullPath,
					children: route.children
				};

				Object.assign(accumulatedParams, prefixResult.params);
				accumulatedMatches.push(match);

				// Recurse into children
				if (route.children && prefixResult.remainingPath) {
					return matchRouteLevel(route.children, prefixResult.remainingPath, fullPath, accumulatedMatches, accumulatedParams);
				}

				return {
					matches: accumulatedMatches,
					params: accumulatedParams,
					isExactMatch: prefixResult.remainingPath === ''
				};
			}
		}
	}

	return {
		matches: accumulatedMatches,
		params: accumulatedParams,
		isExactMatch: false
	};
}
