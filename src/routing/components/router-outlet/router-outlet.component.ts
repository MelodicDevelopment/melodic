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
	@Service(RouterService) private _router!: RouterService;

	elementRef!: HTMLElement;
	routes: IRouteWithMatcher[] = [];

	private _currentComponent: string | null = null;
	private _initialized = false;
	private _navigationHandler: (() => void) | null = null;

	onInit(): void {
		this._navigationHandler = () => {
			this.renderPath(window.location.pathname);
		};
		window.addEventListener('NavigationEvent', this._navigationHandler);
	}

	onDestroy(): void {
		if (this._navigationHandler) {
			window.removeEventListener('NavigationEvent', this._navigationHandler);
			this._navigationHandler = null;
		}
	}

	onCreate(): void {
		// Defer initial render to allow property binding to complete
		queueMicrotask(() => {
			this._initialized = true;
			this.renderPath(window.location.pathname);
		});
	}

	onPropertyChange(name: string): void {
		// Re-render when routes are set
		if (name === 'routes' && this._initialized) {
			this._currentComponent = null; // Reset to force re-render
			this.renderPath(window.location.pathname);
		}
	}

	private async renderPath(currentPath: string): Promise<void> {
		const shadowRoot = this.elementRef.shadowRoot;
		if (!shadowRoot) return;

		// Remove leading slash for matching
		const pathToMatch = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
		const route: IRoute = this.findRouteMatch(pathToMatch);

		if (route.redirectTo) {
			// Only redirect if we're not already at the target
			if (window.location.pathname !== route.redirectTo) {
				this._router.navigate(route.redirectTo);
			}
			return;
		}

		// Only re-render if component changed
		if (route.component && route.component !== this._currentComponent) {
			// Lazy load the component if loadComponent is defined
			if (route.loadComponent) {
				await route.loadComponent();
			}

			this._currentComponent = route.component;

			while (this.elementRef.firstChild) {
				this.elementRef.firstChild.remove();
			}

			const component: HTMLElement = document.createElement(route.component);
			this.elementRef.appendChild(component);
		}
	}

	private findRouteMatch(path: string): IRoute {
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
