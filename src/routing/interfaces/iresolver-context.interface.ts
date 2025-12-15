import type { IRouteMatch } from './iroute-match.interface';

export interface IResolverContext {
	route: IRouteMatch;
	matchedRoutes: IRouteMatch[];
	params: Record<string, string>;
	queryParams: URLSearchParams;
	targetPath: string;
}
