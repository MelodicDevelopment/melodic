import type { IRoute } from './iroute.interface';

export interface IRouteMatch {
	route: IRoute;
	params: Record<string, string>;
	matchedPath: string;
	remainingPath: string;
	fullPath: string;
	children?: IRoute[];
}
