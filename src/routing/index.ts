// Types - Route configuration and matching
export type { RouterStateEvent } from './types';
export type { IRoute, IResolvedRoute, IRouteMatch, IRouteMatchResult, IRouterEventState } from './interfaces';

// Types - Guards
export type { GuardResult, AsyncGuardResult, IGuardContext, IRouteGuard, GuardFunction } from './interfaces';
export { createGuard, createDeactivateGuard } from './interfaces';

// Types - Resolvers
export type { IResolverContext, ResolverResult, IRouteResolver, ResolverFunction } from './interfaces';
export { createResolver } from './interfaces';

// Types - Context
export type { IRouteContext, IRouteContextChangeEvent } from './interfaces';

// Classes
export { RouteMatcher, matchRouteTree, findRouteByName, buildPathFromRoute } from './classes/route-matcher.class';

// Services
export { RouterService, RouteContextService, RouteContextEvent, ROUTE_CONTEXT_EVENT } from './services';
export type { INavigationOptions, INavigationResult } from './services';

// Components
export { RouterOutletComponent, RouterLinkComponent } from './components';

// Directives (import to auto-register)
import './directives';
export { routerLinkDirective } from './directives';
export type { IRouterLinkOptions } from './directives';
