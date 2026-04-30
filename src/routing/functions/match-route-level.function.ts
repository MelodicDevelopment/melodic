import { RouteMatcher } from '../classes/route-matcher.class';
import type { IRouteMatchResult } from '../interfaces/iroute-match-result.interface';
import type { IRouteMatch } from '../interfaces/iroute-match.interface';
import type { IRoute } from '../interfaces/iroute.interface';

function resolveRedirectTarget(redirectTo: string, basePath: string): string {
	if (redirectTo.startsWith('/')) {
		return redirectTo;
	}

	return basePath ? `/${basePath}/${redirectTo}` : `/${redirectTo}`;
}

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
				redirectTo: resolveRedirectTarget(route.redirectTo, basePath)
			};
		}

		const exactMatch = matcher.parse(remainingPath);

		if (exactMatch !== null) {
			const matchedPath = remainingPath;
			const fullPath = basePath ? `${basePath}/${matchedPath}` : matchedPath;
			const match: IRouteMatch = {
				route,
				params: exactMatch,
				matchedPath,
				remainingPath: '',
				fullPath,
				children: route.children
			};

			Object.assign(accumulatedParams, exactMatch);
			accumulatedMatches.push(match);

			if (route.children) {
				const emptyRedirect = route.children.find(child => child.path === '' && child.redirectTo);
				if (emptyRedirect && emptyRedirect.redirectTo) {
					return {
						matches: accumulatedMatches,
						params: accumulatedParams,
						isExactMatch: false,
						redirectTo: resolveRedirectTarget(emptyRedirect.redirectTo, fullPath)
					};
				}
			}

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
