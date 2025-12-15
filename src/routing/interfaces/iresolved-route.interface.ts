import type { IRoute } from './iroute.interface';

export interface IResolvedRoute extends IRoute {
	fullPath: string;
	params: Record<string, string>;
	parent?: IResolvedRoute;
	childrenLoaded?: boolean;
}
