import type { IRouteMatch } from './iroute-match.interface';

export interface IGuardContext {
	route: IRouteMatch;
	matchedRoutes: IRouteMatch[];
	params: Record<string, string>;
	queryParams: URLSearchParams;
	targetPath: string;
	currentPath: string;
	data?: Record<string, unknown>;
}
