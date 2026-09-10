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

/**
 * Route matchers are pure functions of `route.path`, so building one per route
 * per match — several times per navigation — is wasted work. Cached against the
 * route object itself, which is stable for the life of the route tree.
 */
const matcherCache = new WeakMap<IRoute, RouteMatcher>();

function getMatcher(route: IRoute): RouteMatcher {
	let matcher = matcherCache.get(route);

	if (!matcher) {
		matcher = new RouteMatcher(route.path);
		matcherCache.set(route, matcher);
	}

	return matcher;
}

/**
 * Substitute `:name` / `*name` tokens in a `redirectTo` target with the params
 * captured by the matched route, so `{ path: 'u/:id', redirectTo: 'users/:id' }`
 * sends `/u/7` to `/users/7` rather than to the literal `/users/:id`.
 */
function substituteRedirectParams(redirectTo: string, params: Record<string, string>): string {
	if (!redirectTo.includes(':') && !redirectTo.includes('*')) {
		return redirectTo;
	}

	return redirectTo.replace(/[:*](\w+)/g, (token, name: string) => {
		const value = params[name];
		return value === undefined ? token : encodeURIComponent(value);
	});
}

/**
 * Upper bound on nesting depth. Route trees are finite, but a misconfigured
 * tree that shares a children array with an ancestor would otherwise recurse
 * forever through default (empty-path) children.
 */
const MAX_MATCH_DEPTH = 64;

export function matchRouteLevel(
	routes: IRoute[],
	remainingPath: string,
	basePath: string,
	accumulatedMatches: IRouteMatch[],
	accumulatedParams: Record<string, string>,
	depth: number = 0
): IRouteMatchResult {
	if (depth > MAX_MATCH_DEPTH) {
		throw new Error(`Route tree nesting exceeds ${MAX_MATCH_DEPTH} levels — check for cyclic children definitions`);
	}

	// First partial (prefix-matched parent whose children 404'd) result, kept
	// as a fallback so nested outlets can still render the parent + a 404 view
	// when no later sibling produces an exact match.
	let partialFallback: IRouteMatchResult | null = null;

	for (const route of routes) {
		const matcher = getMatcher(route);

		const exactMatch = matcher.parse(remainingPath);

		// A redirecting route redirects whenever it matches — including when it
		// carries params (`{ path: 'u/:id', redirectTo: 'users/:id' }`), which a
		// literal `route.path === remainingPath` comparison never saw.
		if (route.redirectTo && exactMatch !== null) {
			const redirectParams = { ...accumulatedParams, ...exactMatch };

			return {
				matches: accumulatedMatches,
				params: accumulatedParams,
				isExactMatch: false,
				redirectTo: resolveRedirectTarget(substituteRedirectParams(route.redirectTo, redirectParams), basePath)
			};
		}

		if (exactMatch !== null) {
			const matchedPath = remainingPath;
			// A default (empty-path) child adds no segment to the full path.
			const fullPath = basePath && matchedPath ? `${basePath}/${matchedPath}` : basePath || matchedPath;
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
						redirectTo: resolveRedirectTarget(substituteRedirectParams(emptyRedirect.redirectTo, accumulatedParams), fullPath)
					};
				}

				// Descend into a default (empty-path) child so its guards,
				// resolvers and component are part of the committed chain.
				// Nested outlets render `matches[depth]`, so a default child
				// that is left out of the chain would never render — and,
				// worse, its guards would never run.
				const emptyChild = route.children.find(child => child.path === '' && !child.redirectTo);
				if (emptyChild) {
					return matchRouteLevel(route.children, '', fullPath, accumulatedMatches, accumulatedParams, depth + 1);
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

				// Recurse into children
				if (route.children && prefixResult.remainingPath) {
					// Snapshot so we can backtrack to later siblings if none of
					// this parent's children match the remaining path.
					const matchesLengthBefore = accumulatedMatches.length;
					const paramsSnapshot = { ...accumulatedParams };

					Object.assign(accumulatedParams, prefixResult.params);
					accumulatedMatches.push(match);

					const childResult = matchRouteLevel(route.children, prefixResult.remainingPath, fullPath, accumulatedMatches, accumulatedParams, depth + 1);

					if (childResult.isExactMatch || childResult.redirectTo) {
						return childResult;
					}

					// Children 404'd — remember the first partial result, then
					// backtrack and try the remaining siblings.
					if (!partialFallback) {
						partialFallback = {
							matches: [...childResult.matches],
							params: { ...childResult.params },
							isExactMatch: false
						};
					}

					accumulatedMatches.length = matchesLengthBefore;
					for (const key of Object.keys(accumulatedParams)) {
						delete accumulatedParams[key];
					}
					Object.assign(accumulatedParams, paramsSnapshot);

					continue;
				}

				Object.assign(accumulatedParams, prefixResult.params);
				accumulatedMatches.push(match);

				return {
					matches: accumulatedMatches,
					params: accumulatedParams,
					isExactMatch: prefixResult.remainingPath === ''
				};
			}
		}
	}

	return (
		partialFallback ?? {
			matches: accumulatedMatches,
			params: accumulatedParams,
			isExactMatch: false
		}
	);
}
