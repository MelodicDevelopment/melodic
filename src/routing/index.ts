// Types - Route configuration and matching
export type { RouterStateEvent } from './types/router-state-event.type';
export type { IRoute } from './interfaces/iroute.interface';
export type { IResolvedRoute } from './interfaces/iresolved-route.interface';
export type { IRouteMatch } from './interfaces/iroute-match.interface';
export type { IRouteMatchResult } from './interfaces/iroute-match-result.interface';
export type { IRouterEventState } from './interfaces/irouter-event-state.interface';

// Types - Guards
export type { GuardResult, AsyncGuardResult } from './types/guard-result.type';
export type { GuardFunction } from './types/guard-function.type';
export type { IGuardContext } from './interfaces/iguard-context.interface';
export type { IRouteGuard } from './interfaces/iroute-guard.interface';
export { createGuard } from './functions/create-guard.function';
export { createDeactivateGuard } from './functions/create-deactivate-guard.function';

// Types - Resolvers
export type { ResolverResult } from './types/resolver-result.type';
export type { ResolverFunction } from './types/resolver-function.type';
export type { IResolverContext } from './interfaces/iresolver-context.interface';
export type { IRouteResolver } from './interfaces/iroute-resolver.interface';
export { createResolver } from './functions/create-resolver.function';

// Types - Context
export type { IRouteContext } from './interfaces/iroute-context.interface';
export type { IRouteContextChangeEvent } from './interfaces/iroute-context-change-event.interface';

// Types - Navigation
export type { INavigationOptions } from './interfaces/inavigation-options.interface';
export type { INavigationResult } from './interfaces/inavigation-result.interface';

// Classes
export { RouteMatcher } from './classes/route-matcher.class';
export { RouteContextEvent, ROUTE_CONTEXT_EVENT } from './classes/route-context-event.class';

// Functions
export { matchRouteTree } from './functions/match-route-tree.function';
export { findRouteByName } from './functions/find-route-by-name.function';
export { buildPathFromRoute } from './functions/build-path-from-route.function';

// Services
export { RouterService } from './services/router.service';
export { RouteContextService } from './services/route-context.service';

// Components
export { RouterOutletComponent } from './components/router-outlet/router-outlet.component';
export { RouterLinkComponent } from './components/router-link/router-link.component';

// Directives (import to auto-register)
import './directives/router-link.directive';
export { routerLinkDirective } from './directives/router-link.directive';
export type { IRouterLinkOptions } from './directives/router-link.directive';
