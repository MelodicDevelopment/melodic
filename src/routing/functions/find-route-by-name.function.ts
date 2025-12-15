import type { IRoute } from '../interfaces/iroute.interface';

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
