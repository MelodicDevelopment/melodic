import type { IRoute, IRouteMatch, IRouteMatchResult } from './interfaces/iroute.interface';

type RuleCheck = (value: string) => boolean;
type Rule = RegExp | RuleCheck | string;
type Rules = { [key: string]: Rule };
type RouteMatchParams = { [key: string]: string } | null;

/**
 * Enhanced route matcher that supports hierarchical route matching.
 */
export class RouteMatcher {
	#reEscape: RegExp = /[-[\]{}()+?.,\\^$|#\s]/g;
	#reParam: RegExp = /([:*])(\w+)/g;
	#names: string[] = [];

	#route: string;
	#routeRegex: RegExp;
	#prefixRegex: RegExp;
	#rules: Rules | undefined;
	#isWildcard: boolean = false;

	constructor(route: string, rules?: Rules) {
		this.#route = route;
		this.#rules = rules;
		this.#isWildcard = route.includes('*');

		let escapedRoute = this.#route.replace(this.#reEscape, '\\$&');
		escapedRoute = escapedRoute.replace(this.#reParam, (_, mode: string, name: string) => {
			this.#names.push(name);
			return mode === ':' ? '([^/]*)' : '(.*)';
		});

		// Full match regex (original behavior)
		this.#routeRegex = new RegExp('^' + escapedRoute + '$');

		// Prefix match regex - for matching the start of a path with child routes
		this.#prefixRegex = new RegExp('^' + escapedRoute + '(?:/|$)');
	}

	/**
	 * Parse a URL path and extract parameters (exact match).
	 */
	parse(url: string): RouteMatchParams {
		let i: number = 0;
		let param: Rule;
		let value: string;
		const params: RouteMatchParams = {};
		const matches: RegExpMatchArray | null = url.match(this.#routeRegex);

		if (!matches) {
			return null;
		}

		while (i < this.#names.length) {
			param = this.#names[i++];
			value = matches[i];

			if (this.#rules && param in this.#rules && !this.#validateRule(this.#rules[param], value)) {
				return null;
			}

			params[param] = value;
		}

		return params;
	}

	/**
	 * Match the beginning of a path (for routes with children).
	 * Returns the matched portion and remaining path.
	 */
	parsePrefix(url: string): { params: RouteMatchParams; matchedPath: string; remainingPath: string } | null {
		// Handle empty route (matches everything as prefix)
		if (this.#route === '') {
			return {
				params: {},
				matchedPath: '',
				remainingPath: url
			};
		}

		const matches = url.match(this.#prefixRegex);
		if (!matches) {
			return null;
		}

		const params: RouteMatchParams = {};
		for (let i = 0; i < this.#names.length; i++) {
			const name = this.#names[i];
			const value = matches[i + 1];

			if (this.#rules && name in this.#rules && !this.#validateRule(this.#rules[name], value)) {
				return null;
			}

			params[name] = value;
		}

		// Calculate matched and remaining paths
		const matchedPath = this.#calculateMatchedPath(url);
		const remainingPath = url.slice(matchedPath.length).replace(/^\//, '');

		return { params, matchedPath, remainingPath };
	}

	/**
	 * Calculate the portion of the URL that was matched.
	 */
	#calculateMatchedPath(url: string): string {
		// For wildcard routes, the entire remaining path is consumed
		if (this.#isWildcard) {
			return url;
		}

		// Count segments in the route pattern
		const routeSegments = this.#route.split('/').filter(Boolean);
		const urlSegments = url.split('/').filter(Boolean);

		const matchedSegments = urlSegments.slice(0, routeSegments.length);
		return matchedSegments.join('/');
	}

	stringify(params: Record<string, string>): string {
		let re: RegExp;
		let result: string = this.#route;

		for (const param in params) {
			re = new RegExp('[:*]' + param + '\\b');
			result = result.replace(re, params[param]);
		}

		return result.replace(this.#reParam, '');
	}

	#validateRule(rule: Rule, value: string): boolean {
		const type: string = Object.prototype.toString.call(rule).charAt(8);
		return type === 'R' ? (rule as RegExp).test(value) : type === 'F' ? (rule as RuleCheck)(value) : rule == value;
	}
}

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

/**
 * Recursively match routes at a single level.
 */
function matchRouteLevel(
	routes: IRoute[],
	remainingPath: string,
	basePath: string,
	accumulatedMatches: IRouteMatch[],
	accumulatedParams: Record<string, string>
): IRouteMatchResult {
	for (const route of routes) {
		const matcher = new RouteMatcher(route.path);

		// Check for redirect first - only redirect if paths match exactly
		if (route.redirectTo && route.path === remainingPath) {
			return {
				matches: accumulatedMatches,
				params: accumulatedParams,
				isExactMatch: false,
				redirectTo: route.redirectTo
			};
		}

		// Try exact match first (for leaf routes)
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

		// Try prefix match for routes with children
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

	// No match found
	return {
		matches: accumulatedMatches,
		params: accumulatedParams,
		isExactMatch: false
	};
}

/**
 * Find a route by name in the route tree.
 */
export function findRouteByName(routes: IRoute[], name: string): IRoute | null {
	for (const route of routes) {
		if (route.name === name) {
			return route;
		}
		if (route.children) {
			const found = findRouteByName(route.children, name);
			if (found) return found;
		}
	}
	return null;
}

/**
 * Build a URL path from a named route and parameters.
 */
export function buildPathFromRoute(routes: IRoute[], name: string, params: Record<string, string> = {}): string | null {
	const pathParts: string[] = [];

	function findAndBuildPath(routeList: IRoute[], targetName: string): boolean {
		for (const route of routeList) {
			if (route.name === targetName) {
				const matcher = new RouteMatcher(route.path);
				pathParts.push(matcher.stringify(params));
				return true;
			}

			if (route.children) {
				const matcher = new RouteMatcher(route.path);
				const segment = matcher.stringify(params);

				if (findAndBuildPath(route.children, targetName)) {
					pathParts.unshift(segment);
					return true;
				}
			}
		}
		return false;
	}

	if (findAndBuildPath(routes, name)) {
		return '/' + pathParts.filter(Boolean).join('/');
	}

	return null;
}
