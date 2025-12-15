import type { AsyncGuardResult } from '../types/guard-result.type';
import type { IGuardContext } from './iguard-context.interface';

export interface IRouteGuard {
	canActivate?(context: IGuardContext): AsyncGuardResult;
	canDeactivate?(context: IGuardContext): AsyncGuardResult;
}
