// Component system
export { MelodicComponent } from './components/melodic-component.decorator';
export type { Component } from './components/types/component.type';
export type { ComponentMeta } from './components/types/component-meta.type';

// Template system
export { html, css, render } from './template/template';
export type { TemplateResult } from './template/template';

// Directive system
export { Directive, directive, isDirective } from './template/directive';
export type { DirectiveResult } from './template/directive';

// Built-in directives
export { repeat } from './template/directives/repeat.directive';
export { when } from './template/directives/when.directive';
export { classMap } from './template/directives/class-map.directive';
export { styleMap } from './template/directives/style-map.directive';
export { unsafeHTML } from './template/directives/unsafe-html.directive';

// Dependency injection
export { Injectable, Inject, Service } from './injection/decorators';
export { Injector } from './injection/injection-engine.class';
export type { IInjectableMeta } from './injection/interfaces/iinjectable-meta.interface';

// Routing
export {
	RouterService,
	RouterOutletComponent,
	RouterLinkComponent,
	RouteMatcher,
	RouteContextService,
	RouteContextEvent,
	ROUTE_CONTEXT_EVENT,
	matchRouteTree,
	findRouteByName,
	buildPathFromRoute,
	createGuard,
	createDeactivateGuard,
	createResolver
} from './routing';
export type {
	IRoute,
	IResolvedRoute,
	IRouteMatch,
	IRouteMatchResult,
	IRouterEventState,
	RouterStateEvent,
	INavigationOptions,
	INavigationResult,
	GuardResult,
	AsyncGuardResult,
	IGuardContext,
	IRouteGuard,
	GuardFunction,
	IResolverContext,
	ResolverResult,
	IRouteResolver,
	ResolverFunction,
	IRouteContext,
	IRouteContextChangeEvent
} from './routing';
