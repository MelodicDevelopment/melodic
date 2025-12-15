import type { IRouteGuard } from '../interfaces/iroute-guard.interface';
import type { GuardFunction } from '../types/guard-function.type';

export function createDeactivateGuard(fn: GuardFunction): IRouteGuard {
	return {
		canDeactivate: fn
	};
}
