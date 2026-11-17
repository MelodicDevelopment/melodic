import type { IRouteContext } from '../interfaces/iroute-context.interface';

/** @deprecated The router never dispatches this event; outlets receive their context from the parent outlet directly. Kept for compatibility. */
export const ROUTE_CONTEXT_EVENT = 'melodic:route-context';

/** @deprecated The router never dispatches this event; read `RouterService.committedRoute()` / `params()` instead. Kept for compatibility. */
export class RouteContextEvent extends CustomEvent<IRouteContext> {
	constructor(context: IRouteContext) {
		super(ROUTE_CONTEXT_EVENT, {
			bubbles: false,
			composed: true,
			detail: context
		});
	}
}
