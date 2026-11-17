import { getMatcher } from './match-route-level.function';
import type { IRoute } from '../interfaces/iroute.interface';

export function buildPathFromRoute(routes: IRoute[], name: string, params: Record<string, string> = {}): string | null {
	const pathParts: string[] = [];

	function findAndBuildPath(routeList: IRoute[], targetName: string): boolean {
		for (const route of routeList) {
			if (route.name === targetName) {
				const matcher = getMatcher(route);
				pathParts.push(matcher.stringify(params));
				return true;
			}

			if (route.children) {
				const matcher = getMatcher(route);
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
		// Collapse empty segments produced by unfilled params (e.g. a route
		// `items/:a/:b` given only `b` yields `items//x`), not just empty parts.
		const segments = pathParts.join('/').split('/').filter(Boolean);
		return '/' + segments.join('/');
	}

	return null;
}
