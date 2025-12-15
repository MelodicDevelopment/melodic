import type { IResolverContext } from '../interfaces/iresolver-context.interface';
import type { ResolverResult } from './resolver-result.type';

export type ResolverFunction<T = unknown> = (context: IResolverContext) => ResolverResult<T>;
