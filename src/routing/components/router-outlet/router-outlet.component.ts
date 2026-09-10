import { MelodicComponent } from '../../../components/decorators/melodic-component.decorator';
import { Service } from '../../../injection/decorators/service.decorator';
import { RouterService } from '../../services/router.service';
import type { IRoute } from '../../interfaces/iroute.interface';
import type { IRouteContext } from '../../interfaces/iroute-context.interface';
import { html } from '../../../template/functions/html.function';
import type { IRouteMatch } from '../../interfaces/iroute-match.interface';
import type { IRouteMatchResult } from '../../interfaces/iroute-match-result.interface';
import type { IRouteChangeAware } from '../../interfaces/iroute-change.interface';

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
	// Identity of the currently rendered match (route + params), so a param
	// change under an unchanged component tag is still detected.
	private _currentSignature: string | null = null;
	private _currentElement: HTMLElement | null = null;
	private _childOutlets: Map<string, RouterOutletComponent> = new Map();
	private _parentOutlet: RouterOutletComponent | null = null;
	private _initialized = false;
	private _routeSubscriptionCleanup: (() => void) | null = null;
	// Bumped on every render request and on destroy. Async render work checks
	// it after each await so a slower, older render (e.g. a lazy component
	// still loading) can never overwrite a newer one or write into a
	// destroyed outlet.
	private _renderGeneration = 0;

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
		this._renderGeneration++;
		this._routeSubscriptionCleanup?.();
		this._routeSubscriptionCleanup = null;

		if (this._parentOutlet) {
			this._parentOutlet.unregisterChildOutlet(this.name);
		}
	}

	public onPropertyChange(name: string, oldValue: unknown, newValue: unknown): void {
		void oldValue;
		if (name === 'routes' && this._initialized) {
			this._currentComponent = null;
			this._currentSignature = null;

			// Routes changed - update router if root and re-run the pipeline.
			// The hook fires BEFORE the backing field updates, so use the
			// incoming value rather than `this.routes`.
			if (this._depth === 0) {
				this._router.setRoutes((newValue as IRoute[] | undefined) ?? []);
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

	/**
	 * Walk strictly upwards — ancestors in the current root, then the shadow
	 * host, then repeat — to find the outlet this one nests inside.
	 *
	 * Looking for *any* `router-outlet` inside the host's shadow root (as this
	 * used to) picks whichever one comes first in document order, so two
	 * sibling outlets in the same component made the second a "child" of the
	 * first and rendered it at the wrong depth.
	 */
	private findParentOutlet(): void {
		let node: Element = this.elementRef;

		for (let hops = 0; hops < 64; hops++) {
			const ancestor = node.parentElement?.closest?.('router-outlet');
			if (ancestor && ancestor !== this.elementRef) {
				this.adoptParentOutlet(ancestor);
				return;
			}

			const root = node.getRootNode();
			if (!(root instanceof ShadowRoot)) {
				break;
			}

			const host = root.host;
			if (host.tagName.toLowerCase() === 'router-outlet' && host !== this.elementRef) {
				this.adoptParentOutlet(host);
				return;
			}

			node = host;
		}

		// No parent found - this is root
		this._depth = 0;
	}

	private adoptParentOutlet(element: Element): void {
		this._parentOutlet = ((element as unknown as { component?: RouterOutletComponent }).component ?? null) as RouterOutletComponent | null;
		this._depth = (this._parentOutlet?._depth ?? -1) + 1;
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
			parent: this._context,
			matches: this._context.matches
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
				parent: undefined,
				matches: result.matches
			};

			await this.renderMatch(match);
		} else {
			await this.render404();
		}
	}

	/**
	 * Nested outlets render the committed chain's match at their own depth.
	 * The chain was matched, lazily loaded, guarded and resolved by the
	 * service in one piece, so an outlet never re-matches on its own — doing
	 * so would let a route that is not part of the guarded chain render.
	 */
	private async renderFromContext(): Promise<void> {
		if (!this._context || this.routes.length === 0) {
			return;
		}

		const match = this._context.matches?.[this._depth];

		if (match) {
			this._context = {
				...this._context,
				currentMatch: match,
				ancestorMatches: [...this._context.ancestorMatches, match],
				params: { ...this._context.params, ...match.params }
			};

			await this.renderMatch(match);
		} else {
			await this.render404();
		}
	}

	/**
	 * Identity of a rendered match: the route object plus the params that
	 * produced it. Two navigations to `/users/1` and `/users/2` match the same
	 * route with the same component tag but are NOT the same view.
	 */
	private matchSignature(match: IRouteMatch): string {
		return `${match.fullPath}|${JSON.stringify(match.params)}`;
	}

	private async renderMatch(match: IRouteMatch): Promise<void> {
		const route = match.route;
		const signature = this.matchSignature(match);

		if (route.component === this._currentComponent) {
			// Same component tag. If the params changed (`/users/1 → /users/2`)
			// the mounted instance is showing stale data: `onCreate` will not
			// run again, so tell it explicitly and re-render it. Templates
			// reading `router.params()` re-render on their own; this covers
			// templates reading `getParam()` and components that need a hook.
			if (signature !== this._currentSignature) {
				this._currentSignature = signature;
				this.notifyRouteChange(match);
			}

			this.updateChildOutlets();
			return;
		}

		this._currentSignature = signature;

		const generation = ++this._renderGeneration;

		// The pipeline already awaited lazy loads before committing; this is a
		// cheap no-op for the pipeline path and a safety net for callers
		// driving the outlet manually.
		if (route.loadComponent) {
			try {
				await route.loadComponent();
			} catch (error) {
				console.error('Failed to load component:', error);
				if (generation === this._renderGeneration) {
					await this.render404();
				}
				return;
			}

			if (generation !== this._renderGeneration) {
				return;
			}
		}

		if (route.component) {
			await this.renderComponent(route.component);
		} else {
			// A matched route with no component contributes no view. Leaving
			// the previous element mounted showed the *old* page under the new
			// URL; clear it instead.
			this.clearCurrentElement();
			this._currentComponent = null;
			this.updateChildOutlets();
		}
	}

	/**
	 * Tell a component that stayed mounted across a route change that its
	 * params/resolved data moved, then re-render it.
	 */
	private notifyRouteChange(match: IRouteMatch): void {
		const element = this._currentElement as (HTMLElement & { component?: IRouteChangeAware; requestRender?: () => void }) | null;

		if (!element) {
			return;
		}

		element.component?.onRouteChange?.({
			params: { ...match.params },
			queryParams: this._router.getQueryParams(),
			resolvedData: this._router.getResolvedData(),
			match
		});

		element.requestRender?.();
	}

	private clearCurrentElement(): void {
		if (this._currentElement) {
			this._currentElement.remove();
			this._currentElement = null;
		}
	}

	private async renderComponent(componentTag: string): Promise<void> {
		const shadowRoot = this.elementRef.shadowRoot;

		if (!shadowRoot) {
			return;
		}

		this.clearCurrentElement();

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
		this._renderGeneration++;
		const notFoundRoute = this.routes.find((r) => r.path === '404' || r.path === '**');

		if (notFoundRoute?.component) {
			await this.renderComponent(notFoundRoute.component);
		} else if (this._depth === 0 && window.location.pathname !== '/404') {
			this._router.navigate('/404', { replace: true });
		}
	}
}
