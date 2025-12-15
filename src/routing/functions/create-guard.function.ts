import type { IRouteGuard } from '../interfaces/iroute-guard.interface';
import type { GuardFunction } from '../types/guard-function.type';

export function createGuard(fn: GuardFunction): IRouteGuard {
	return {
		canActivate: fn
	};
}
