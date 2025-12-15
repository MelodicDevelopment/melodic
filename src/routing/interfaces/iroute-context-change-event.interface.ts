import type { IRouteContext } from './iroute-context.interface';

export interface IRouteContextChangeEvent {
	context: IRouteContext;
	previousContext?: IRouteContext;
}
