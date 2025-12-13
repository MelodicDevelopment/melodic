import { MelodicComponent } from '../../../components/melodic-component.decorator';
import { html } from '../../../template/template';
import { Service } from '../../../injection/decorators/service.decorator';
import { matchRouteTree } from '../../classes/route-matcher.class';
import { RouterService } from '../../services/router.service';
import type { IRoute, IRouteMatch, IRouteMatchResult } from '../../interfaces/iroute.interface';
import type { IRouteContext } from '../../interfaces/iroute-context.interface';

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

@MelodicComponent({
	selector: 'router-outlet',
	template: () => html`<slot></slot>`
})
export class RouterOutletComponent {
	@Service(RouterService) private _router!: RouterService;

	elementRef!: HTMLElement;

	/** Routes for this outlet (set via property binding for root, or inherited for nested) */
	routes: IRoute[] = [];

	/** Outlet name for named outlets (optional) */
	name: string = 'primary';

	/** Current depth in the outlet hierarchy (0 = root) */
	private _depth: number = 0;

	/** Current route context */
	#context: IRouteContext | null = null;

	/** Currently rendered component tag */
	#currentComponent: string | null = null;

	/** Currently rendered component element */
	#currentElement: HTMLElement | null = null;

	/** Child outlets registered with this outlet */
	#childOutlets: Map<string, RouterOutletComponent> = new Map();

	/** Parent outlet reference */
	#parentOutlet: RouterOutletComponent | null = null;

	/** Whether initial render has happened */
	#initialized = false;

	/** Cleanup function for navigation listener */
	#navigationCleanup: (() => void) | null = null;

	onInit(): void {
		// Determine depth by finding parent outlet
		this.#findParentOutlet();

		// Listen for navigation events
		const handler = () => this.#onNavigate();
		window.addEventListener('NavigationEvent', handler);
		this.#navigationCleanup = () => window.removeEventListener('NavigationEvent', handler);

		// Listen for child outlet registrations
		this.elementRef.addEventListener(OUTLET_REGISTER_EVENT, ((event: CustomEvent<IOutletRegistration>) => {
			event.stopPropagation();
			this.#registerChildOutlet(event.detail);
		}) as EventListener);
	}

	onCreate(): void {
		// Defer initial render to allow property binding to complete
		queueMicrotask(() => {
			this.#initialized = true;

			// If root outlet, register routes with router
			if (this._depth === 0 && this.routes.length > 0) {
				this._router.setRoutes(this.routes);
			}

			// Register with parent if nested
			if (this.#parentOutlet) {
				this.#requestContextFromParent();
			} else {
				// Root outlet - initiate routing
				this.#onNavigate();
			}
		});
	}

	onDestroy(): void {
		this.#navigationCleanup?.();

		// Unregister from parent
		if (this.#parentOutlet) {
			this.#parentOutlet.#unregisterChildOutlet(this.name);
		}
	}

	onPropertyChange(name: string): void {
		if (name === 'routes' && this.#initialized) {
			// Routes changed - update router if root and re-render
			if (this._depth === 0) {
				this._router.setRoutes(this.routes);
			}
			this.#currentComponent = null;
			this.#onNavigate();
		}
	}

	/**
	 * Find parent router-outlet by traversing up the DOM.
	 */
	#findParentOutlet(): void {
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
						this.#parentOutlet = (parentOutlet as any).__component as RouterOutletComponent;
						this._depth = (this.#parentOutlet?._depth ?? -1) + 1;
						return;
					}
				}
			} else {
				// Regular DOM - look for parent outlet
				const parentOutlet = element.closest?.('router-outlet');
				if (parentOutlet && parentOutlet !== this.elementRef) {
					this.#parentOutlet = (parentOutlet as any).__component as RouterOutletComponent;
					this._depth = (this.#parentOutlet?._depth ?? -1) + 1;
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
	#requestContextFromParent(): void {
		const event = new CustomEvent<IOutletRegistration>(OUTLET_REGISTER_EVENT, {
			bubbles: true,
			composed: true,
			detail: {
				outlet: this,
				callback: (context: IRouteContext) => this.#receiveContext(context)
			}
		});

		this.elementRef.dispatchEvent(event);
	}

	/**
	 * Register a child outlet.
	 */
	#registerChildOutlet(registration: IOutletRegistration): void {
		this.#childOutlets.set(registration.outlet.name, registration.outlet);

		// Provide context to child if we have it
		if (this.#context?.currentMatch?.children) {
			const childContext = this.#createChildContext();
			if (childContext) {
				registration.callback(childContext);
			}
		}
	}

	/**
	 * Unregister a child outlet.
	 */
	#unregisterChildOutlet(name: string): void {
		this.#childOutlets.delete(name);
	}

	/**
	 * Receive context from parent outlet.
	 */
	#receiveContext(context: IRouteContext): void {
		this.#context = context;
		this.routes = context.routes;
		this.#renderFromContext();
	}

	/**
	 * Create context for child outlets.
	 */
	#createChildContext(): IRouteContext | null {
		if (!this.#context?.currentMatch) return null;

		const match = this.#context.currentMatch;

		return {
			depth: this._depth + 1,
			routes: match.children ?? [],
			currentMatch: undefined, // Will be set when child matches
			ancestorMatches: [...this.#context.ancestorMatches],
			params: { ...this.#context.params },
			remainingPath: match.remainingPath,
			basePath: match.fullPath,
			parent: this.#context
		};
	}

	/**
	 * Handle navigation events.
	 */
	#onNavigate(): void {
		if (!this.#initialized) return;

		if (this._depth === 0) {
			// Root outlet - perform full route matching
			this.#matchAndRender(window.location.pathname);
		}
		// Nested outlets wait for context from parent
	}

	/**
	 * Match the current path and render (root outlet only).
	 */
	async #matchAndRender(fullPath: string): Promise<void> {
		const routes = this.routes.length > 0 ? this.routes : this._router.getRoutes();

		if (routes.length === 0) return;

		const matchResult = matchRouteTree(routes, fullPath);

		// Handle redirects
		if (matchResult.redirectTo) {
			if (window.location.pathname !== matchResult.redirectTo) {
				this._router.navigate(matchResult.redirectTo, { replace: true });
			}
			return;
		}

		// Update router with match result
		this._router.setCurrentMatches(matchResult);

		// Render the first matched route at this level
		if (matchResult.matches.length > 0) {
			const match = matchResult.matches[0];

			// Build context for this outlet
			this.#context = {
				depth: 0,
				routes: routes,
				currentMatch: match,
				ancestorMatches: [match],
				params: match.params,
				remainingPath: match.remainingPath,
				basePath: '',
				parent: undefined
			};

			await this.#renderMatch(match, matchResult);
		} else {
			// No match - render 404
			await this.#render404();
		}
	}

	/**
	 * Render from context (nested outlets).
	 */
	async #renderFromContext(): Promise<void> {
		if (!this.#context || this.routes.length === 0) return;

		const remainingPath = this.#context.remainingPath;

		// Match against our routes
		const matchResult = matchRouteTree(this.routes, remainingPath, this.#context.basePath);

		// Handle redirects
		if (matchResult.redirectTo) {
			const fullRedirect = this.#context.basePath ? `/${this.#context.basePath}/${matchResult.redirectTo}`.replace(/\/+/g, '/') : matchResult.redirectTo;

			if (window.location.pathname !== fullRedirect) {
				this._router.navigate(fullRedirect, { replace: true });
			}
			return;
		}

		if (matchResult.matches.length > 0) {
			const match = matchResult.matches[0];

			// Update context with current match
			this.#context = {
				...this.#context,
				currentMatch: match,
				ancestorMatches: [...this.#context.ancestorMatches, match],
				params: { ...this.#context.params, ...match.params }
			};

			await this.#renderMatch(match, matchResult);
		} else {
			await this.#render404();
		}
	}

	/**
	 * Render a matched route.
	 */
	async #renderMatch(match: IRouteMatch, _matchResult: IRouteMatchResult): Promise<void> {
		const route = match.route;

		// Skip if same component
		if (route.component === this.#currentComponent) {
			// Still need to update child outlets with new context
			this.#updateChildOutlets();
			return;
		}

		// Lazy load children if needed
		if (route.loadChildren && !match.children) {
			try {
				const module = await route.loadChildren();
				match.children = module.routes;
				route.children = module.routes;
			} catch (error) {
				console.error('Failed to load child routes:', error);
				await this.#render404();
				return;
			}
		}

		// Lazy load component if needed
		if (route.loadComponent) {
			try {
				await route.loadComponent();
			} catch (error) {
				console.error('Failed to load component:', error);
				await this.#render404();
				return;
			}
		}

		if (route.component) {
			await this.#renderComponent(route.component);
		}
	}

	/**
	 * Render a component in this outlet.
	 * Note: Route params and data are NOT injected into components.
	 * Components should use RouterService.getParams(), getRouteData(), and getResolvedData() instead.
	 */
	async #renderComponent(componentTag: string): Promise<void> {
		const shadowRoot = this.elementRef.shadowRoot;
		if (!shadowRoot) return;

		// Remove existing component
		if (this.#currentElement) {
			this.#currentElement.remove();
			this.#currentElement = null;
		}

		this.#currentComponent = componentTag;

		// Create new component
		const component = document.createElement(componentTag);

		// Store reference for child outlet lookups
		(component as any).__parentOutlet = this;

		shadowRoot.appendChild(component);
		this.#currentElement = component;

		// Update child outlets after component is rendered
		queueMicrotask(() => this.#updateChildOutlets());
	}

	/**
	 * Update registered child outlets with new context.
	 */
	#updateChildOutlets(): void {
		const childContext = this.#createChildContext();
		if (!childContext) return;

		for (const [, childOutlet] of this.#childOutlets) {
			childOutlet.#receiveContext(childContext);
		}
	}

	/**
	 * Render 404 page.
	 */
	async #render404(): Promise<void> {
		// Look for a 404 route
		const notFoundRoute = this.routes.find((r) => r.path === '404' || r.path === '**');

		if (notFoundRoute?.component) {
			await this.#renderComponent(notFoundRoute.component);
		} else if (this._depth === 0) {
			// Only root outlet handles final 404
			this._router.navigate('/404', { replace: true });
		}
	}

	/**
	 * Get the current depth of this outlet.
	 */
	getDepth(): number {
		return this._depth;
	}

	/**
	 * Get the current route context.
	 */
	getContext(): IRouteContext | null {
		return this.#context;
	}
}
