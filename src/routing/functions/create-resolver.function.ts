import type { IRouteResolver } from '../interfaces/iroute-resolver.interface';
import type { ResolverFunction } from '../types/resolver-function.type';

export function createResolver<T>(fn: ResolverFunction<T>): IRouteResolver<T> {
	return {
		resolve: fn
	};
}
