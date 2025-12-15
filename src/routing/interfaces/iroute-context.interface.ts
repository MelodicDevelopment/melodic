import type { IRoute } from './iroute.interface';
import type { IRouteMatch } from './iroute-match.interface';

export interface IRouteContext {
	depth: number;
	routes: IRoute[];
	currentMatch?: IRouteMatch;
	ancestorMatches: IRouteMatch[];
	params: Record<string, string>;
	remainingPath: string;
	basePath: string;
	parent?: IRouteContext;
}
