import type { ResolverResult } from '../types/resolver-result.type';
import type { IResolverContext } from './iresolver-context.interface';

export interface IRouteResolver<T = unknown> {
	resolve(context: IResolverContext): ResolverResult<T>;
}
