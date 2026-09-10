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
	/**
	 * The full committed match chain. Outlets render `matches[depth]`;
	 * nested outlets never re-match the URL themselves.
	 */
	matches?: IRouteMatch[];
}
