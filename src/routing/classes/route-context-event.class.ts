import type { IRouteContext } from '../interfaces/iroute-context.interface';

export const ROUTE_CONTEXT_EVENT = 'melodic:route-context';

export class RouteContextEvent extends CustomEvent<IRouteContext> {
	constructor(context: IRouteContext) {
		super(ROUTE_CONTEXT_EVENT, {
			bubbles: false,
			composed: true,
			detail: context
		});
	}
}
