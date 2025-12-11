import { MelodicComponent } from '../../../components/melodic-component.decorator';
import { html } from '../../../template/template';
import { Service } from '../../../injection/decorators/service.decorator';
import { RouteMatcher } from '../../classes/route-matcher.class';
import { RouterService } from '../../services/router.service';
import type { IRoute } from '../../interfaces/iroute.interface';

interface IRouteWithMatcher extends IRoute {
	routeMatcher: RouteMatcher;
}

@MelodicComponent({
	selector: 'router-outlet',
	template: () => html`<slot></slot>`
})
export class RouterOutletComponent {
	@Service('Router') private _router!: RouterService;

	elementRef!: HTMLElement;
	routes: IRouteWithMatcher[] = [];

	#currentComponent: string | null = null;
	#initialized = false;

	onInit(): void {
		window.addEventListener('NavigationEvent', () => {
			this.#renderPath(window.location.pathname);
		});
	}

	onCreate(): void {
		// Defer initial render to allow property binding to complete
		queueMicrotask(() => {
			this.#initialized = true;
			this.#renderPath(window.location.pathname);
		});
	}

	onPropertyChange(name: string): void {
		// Re-render when routes are set
		if (name === 'routes' && this.#initialized) {
			this.#currentComponent = null; // Reset to force re-render
			this.#renderPath(window.location.pathname);
		}
	}

	async #renderPath(currentPath: string): Promise<void> {
		const shadowRoot = this.elementRef.shadowRoot;
		if (!shadowRoot) return;

		// Remove leading slash for matching
		const pathToMatch = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
		const route: IRoute = this.#findRouteMatch(pathToMatch);

		if (route.redirectTo) {
			// Only redirect if we're not already at the target
			if (window.location.pathname !== route.redirectTo) {
				this._router.navigate(route.redirectTo);
			}
			return;
		}

		// Only re-render if component changed
		if (route.component && route.component !== this.#currentComponent) {
			// Lazy load the component if loadComponent is defined
			if (route.loadComponent) {
				await route.loadComponent();
			}

			this.#currentComponent = route.component;

			const existingContent = shadowRoot.querySelector(':not(style):not(slot)');
			if (existingContent) {
				existingContent.remove();
			}

			const component: HTMLElement = document.createElement(route.component);
			shadowRoot.appendChild(component);
		}
	}

	#findRouteMatch(path: string): IRoute {
		const route: IRoute | undefined = this.routes.find((r) => {
			const routeMatcher: RouteMatcher = new RouteMatcher(r.path);
			const result = routeMatcher.parse(path);
			return result !== null;
		});

		return (
			route ?? {
				path: '/',
				redirectTo: '/404'
			}
		);
	}
}
