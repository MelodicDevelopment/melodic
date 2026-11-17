import type { IRouteContext } from './iroute-context.interface';

/** @deprecated Never emitted by the router. Kept for compatibility. */
export interface IRouteContextChangeEvent {
	context: IRouteContext;
	previousContext?: IRouteContext;
}
