import { MelodicComponent } from '../../../components/decorators/melodic-component.decorator';
import { Service } from '../../../injection/decorators/service.decorator';
import { RouterService } from '../../services/router.service';
import type { IRoute } from '../../interfaces/iroute.interface';
import type { IRouteContext } from '../../interfaces/iroute-context.interface';
import { html } from '../../../template/functions/html.function';
import { matchRouteTree } from '../../functions/match-route-tree.function';
import type { IRouteMatch } from '../../interfaces/iroute-match.interface';
import type { IRouteMatchResult } from '../../interfaces/iroute-match-result.interface';

/**
 * Custom event for child outlets to request their context from parent.
 */
const OUTLET_REGISTER_EVENT = 'melodic:outlet-register';

/**
 * Data passed when an outlet registers with its parent.
 */
interface IOutletRegistration {
	outlet: RouterOutletComponent;
	callback: (context: IRouteContext) => void;
}

/**
 * Renders the component of the committed route at its depth.
 *
 * Outlets are dumb renderers: the whole match → guards → resolvers → commit
 * pipeline lives in `RouterService`. The root outlet reacts to the router's
 * committed-route signal; nested outlets receive their context from their
 * parent outlet.
 */
@MelodicComponent({
	selector: 'router-outlet',
	template: () => html`<slot></slot>`
})
export class RouterOutletComponent {
	@Service(RouterService) private _router!: RouterService;

	private _depth: number = 0;
	private _context: IRouteContext | null = null;
	private _currentComponent: string | null = null;
	private _currentElement: HTMLElement | null = null;
	private _childOutlets: Map<string, RouterOutletComponent> = new Map();
	private _parentOutlet: RouterOutletComponent | null = null;
	private _initialized = false;
	private _routeSubscriptionCleanup: (() => void) | null = null;

	public routes: IRoute[] = [];
	public name: string = 'primary';
	public elementRef!: HTMLElement;

	public onInit(): void {
		this.elementRef.addEventListener(OUTLET_REGISTER_EVENT, ((event: CustomEvent<IOutletRegistration>) => {
			if (event.detail.outlet === this) {
				return;
			}

			event.stopPropagation();
			this.registerChildOutlet(event.detail);
		}) as EventListener);
	}

	public onCreate(): void {
		this.findParentOutlet();

		// Defer initial render to allow property binding to complete
		queueMicrotask(() => {
			this._initialized = true;

			// If root outlet, register routes with router
			if (this._depth === 0 && this.routes.length > 0) {
				this._router.setRoutes(this.routes);
			}

			// Register with parent if nested
			if (this._parentOutlet) {
				this.requestContextFromParent();
			} else {
				// Root outlet — render whatever the router pipeline commits.
				this._routeSubscriptionCleanup = this._router.committedRoute.subscribe((result) => {
					void this.renderCommitted(result ?? null);
				});

				const committed = this._router.committedRoute();
				if (committed) {
					// A navigation already committed (e.g. outlet re-created).
					void this.renderCommitted(committed);
				} else {
					// Initiate routing for the current location.
					void this._router.initialNavigation();
				}
			}
		});
	}

	public onDestroy(): void {
		this._routeSubscriptionCleanup?.();
		this._routeSubscriptionCleanup = null;

		if (this._parentOutlet) {
			this._parentOutlet.unregisterChildOutlet(this.name);
		}
	}

	public onPropertyChange(name: string): void {
		if (name === 'routes' && this._initialized) {
			this._currentComponent = null;

			// Routes changed - update router if root and re-run the pipeline
			if (this._depth === 0) {
				this._router.setRoutes(this.routes);
				void this._router.initialNavigation();
			}
		}
	}

	public getDepth(): number {
		return this._depth;
	}

	public getContext(): IRouteContext | null {
		return this._context;
	}

	private findParentOutlet(): void {
		let element: Element | null = this.elementRef;

		while (element) {
			// Check shadow DOM host
			const root = element.getRootNode() as ShadowRoot;
			if (root instanceof ShadowRoot) {
				element = root.host;

				// Check if host contains a router-outlet (the parent)
				if (element.tagName.toLowerCase() !== 'router-outlet') {
					const parentOutlet = element.shadowRoot?.querySelector('router-outlet');
					if (parentOutlet && parentOutlet !== this.elementRef) {
						this._parentOutlet = (parentOutlet as any).component as RouterOutletComponent;
						this._depth = (this._parentOutlet?._depth ?? -1) + 1;
						return;
					}
				}
			} else {
				// Regular DOM - look for parent outlet
				const parentOutlet = element.closest?.('router-outlet');
				if (parentOutlet && parentOutlet !== this.elementRef) {
					this._parentOutlet = (parentOutlet as any).component as RouterOutletComponent;
					this._depth = (this._parentOutlet?._depth ?? -1) + 1;
					return;
				}
				break;
			}
		}

		// No parent found - this is root
		this._depth = 0;
	}

	/**
	 * Request context from parent outlet.
	 */
	private requestContextFromParent(): void {
		const event = new CustomEvent<IOutletRegistration>(OUTLET_REGISTER_EVENT, {
			bubbles: true,
			composed: true,
			detail: {
				outlet: this,
				callback: (context: IRouteContext) => this.receiveContext(context)
			}
		});

		this.elementRef.dispatchEvent(event);
	}

	/**
	 * Register a child outlet.
	 */
	private registerChildOutlet(registration: IOutletRegistration): void {
		this._childOutlets.set(registration.outlet.name, registration.outlet);

		// Provide context to child if we have it
		if (this._context?.currentMatch?.children) {
			const childContext = this.createChildContext();
			if (childContext) {
				registration.callback(childContext);
			}
		}
	}

	private unregisterChildOutlet(name: string): void {
		this._childOutlets.delete(name);
	}

	private receiveContext(context: IRouteContext): void {
		this._context = context;
		this.routes = context.routes;
		this.renderFromContext();
	}

	private createChildContext(): IRouteContext | null {
		if (!this._context?.currentMatch) return null;

		const match = this._context.currentMatch;

		return {
			depth: this._depth + 1,
			routes: match.children ?? [],
			currentMatch: undefined, // Will be set when child matches
			ancestorMatches: [...this._context.ancestorMatches],
			params: { ...this._context.params },
			remainingPath: match.remainingPath,
			basePath: match.fullPath,
			parent: this._context
		};
	}

	/**
	 * Render a committed match result (root outlet only). Guards and
	 * resolvers already ran in the router pipeline — never re-run them here.
	 */
	private async renderCommitted(result: IRouteMatchResult | null): Promise<void> {
		if (!this._initialized || !result) {
			return;
		}

		const routes = this.routes.length > 0 ? this.routes : this._router.getRoutes();

		if (routes.length === 0) {
			return;
		}

		if (result.matches.length > 0) {
			const match = result.matches[0];

			this._context = {
				depth: 0,
				routes: routes,
				currentMatch: match,
				ancestorMatches: [match],
				params: match.params,
				remainingPath: match.remainingPath,
				basePath: '',
				parent: undefined
			};

			await this.renderMatch(match, result);
		} else {
			await this.render404();
		}
	}

	private async renderFromContext(): Promise<void> {
		if (!this._context || this.routes.length === 0) {
			return;
		}

		const remainingPath = this._context.remainingPath;

		const matchResult = matchRouteTree(this.routes, remainingPath, this._context.basePath);

		if (matchResult.redirectTo) {
			if (window.location.pathname !== matchResult.redirectTo) {
				this._router.navigate(matchResult.redirectTo, { replace: true });
			}

			return;
		}

		if (matchResult.matches.length > 0) {
			const match = matchResult.matches[0];

			this._context = {
				...this._context,
				currentMatch: match,
				ancestorMatches: [...this._context.ancestorMatches, match],
				params: { ...this._context.params, ...match.params }
			};

			await this.renderMatch(match, matchResult);
		} else {
			await this.render404();
		}
	}

	private async renderMatch(match: IRouteMatch, _: IRouteMatchResult): Promise<void> {
		const route = match.route;

		if (route.component === this._currentComponent) {
			this.updateChildOutlets();
			return;
		}

		if (route.loadChildren && !match.children) {
			try {
				const module = await route.loadChildren();
				match.children = module.routes;
				route.children = module.routes;
			} catch (error) {
				console.error('Failed to load child routes:', error);
				await this.render404();
				return;
			}
		}

		if (route.loadComponent) {
			try {
				await route.loadComponent();
			} catch (error) {
				console.error('Failed to load component:', error);
				await this.render404();
				return;
			}
		}

		if (route.component) {
			await this.renderComponent(route.component);
		}
	}

	private async renderComponent(componentTag: string): Promise<void> {
		const shadowRoot = this.elementRef.shadowRoot;

		if (!shadowRoot) {
			return;
		}

		if (this._currentElement) {
			this._currentElement.remove();
			this._currentElement = null;
		}

		this._currentComponent = componentTag;

		const component = document.createElement(componentTag);

		(component as any).__parentOutlet = this;

		shadowRoot.appendChild(component);
		this._currentElement = component;

		queueMicrotask(() => this.updateChildOutlets());
	}

	private updateChildOutlets(): void {
		const childContext = this.createChildContext();

		if (!childContext) {
			return;
		}

		for (const [, childOutlet] of this._childOutlets) {
			childOutlet.receiveContext(childContext);
		}
	}

	private async render404(): Promise<void> {
		const notFoundRoute = this.routes.find((r) => r.path === '404' || r.path === '**');

		if (notFoundRoute?.component) {
			await this.renderComponent(notFoundRoute.component);
		} else if (this._depth === 0 && window.location.pathname !== '/404') {
			this._router.navigate('/404', { replace: true });
		}
	}
}
