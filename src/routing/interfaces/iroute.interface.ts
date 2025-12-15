import type { IRouteGuard } from './iroute-guard.interface';
import type { IRouteResolver } from './iroute-resolver.interface';

export interface IRoute {
	path: string;
	component?: string;
	redirectTo?: string;
	loadComponent?: () => Promise<unknown>;
	loadChildren?: () => Promise<{ routes: IRoute[] }>;
	children?: IRoute[];
	canActivate?: IRouteGuard[];
	canDeactivate?: IRouteGuard[];
	resolve?: Record<string, IRouteResolver>;
	data?: Record<string, unknown>;
	name?: string;
}
