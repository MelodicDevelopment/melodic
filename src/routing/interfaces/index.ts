// Route configuration and matching
export type { IRoute, IResolvedRoute, IRouteMatch, IRouteMatchResult } from './iroute.interface';

// Router event state
export type { IRouterEventState } from './irouter-event-state.interface';

// Guards
export type { GuardResult, AsyncGuardResult, IGuardContext, IRouteGuard, GuardFunction } from './iroute-guard.interface';
export { createGuard, createDeactivateGuard } from './iroute-guard.interface';

// Resolvers
export type { IResolverContext, ResolverResult, IRouteResolver, ResolverFunction } from './iroute-resolver.interface';
export { createResolver } from './iroute-resolver.interface';

// Context
export type { IRouteContext, IRouteContextChangeEvent } from './iroute-context.interface';
