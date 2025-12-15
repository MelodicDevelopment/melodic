import { RouteMatcher } from '../classes/route-matcher.class';
import type { IRoute } from '../interfaces/iroute.interface';

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
