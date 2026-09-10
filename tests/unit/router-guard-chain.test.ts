import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Injector } from '../../src/injection';
import { RouterService } from '../../src/routing';
import '../../src/routing/components/router-outlet/router-outlet.component';
import { RouterOutletComponent } from '../../src/routing/components/router-outlet/router-outlet.component';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import type { IRoute } from '../../src/routing/interfaces/iroute.interface';

class LazyLayout {}
MelodicComponent({
	selector: 'chain-lazy-layout',
	template: () => html`<router-outlet></router-outlet>`
})(LazyLayout);

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function settle(rounds: number = 8): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await tick();
	}
}

/**
 * Regressions from the September 2026 review: the committed match chain must
 * contain every route that renders, so every guard/resolver on that chain
 * runs in the service before anything commits. Previously lazy children were
 * loaded and matched inside the outlet (bypassing the pipeline), and
 * default (empty-path) children were left out of the chain entirely.
 */
describe('router guard chain completeness', () => {
	const router = Injector.get(RouterService);
	let outlet: HTMLElement | null = null;

	function mountOutlet(routes: IRoute[]): HTMLElement {
		const element = document.createElement('router-outlet');
		document.body.appendChild(element);
		(element as any).routes = routes;
		outlet = element;
		return element;
	}

	beforeEach(() => {
		history.replaceState(null, '', '/');
	});

	afterEach(async () => {
		outlet?.remove();
		outlet = null;
		await settle();
	});

	it('includes a default (empty-path) child in the match chain', () => {
		const service = new RouterService();
		service.setRoutes([
			{
				path: 'parent',
				component: 'chain-parent',
				children: [
					{ path: '', component: 'chain-default' },
					{ path: 'other', component: 'chain-other' }
				]
			}
		]);

		const result = service.matchPath('/parent');
		service.destroy();

		expect(result.isExactMatch).toBe(true);
		expect(result.matches.map((m) => m.route.component)).toEqual(['chain-parent', 'chain-default']);
		expect(result.matches[1].fullPath).toBe('parent');
	});

	it('runs an empty-path child guard during navigation', async () => {
		const service = new RouterService();
		const guard = vi.fn(() => false);
		service.setRoutes([
			{
				path: 'parent',
				component: 'chain-parent',
				children: [{ path: '', component: 'chain-default', canActivate: [{ canActivate: guard }] }]
			}
		]);

		try {
			const result = await service.navigate('/parent', { scrollToTop: false });
			expect(result.success).toBe(false);
			expect(guard).toHaveBeenCalledTimes(1);
		} finally {
			service.destroy();
		}
	});

	it('still honors an empty-path child redirect over a default child component', () => {
		const service = new RouterService();
		service.setRoutes([
			{
				path: 'parent',
				children: [
					{ path: '', redirectTo: 'landing' },
					{ path: 'landing', component: 'chain-landing' }
				]
			}
		]);

		expect(service.matchPath('/parent').redirectTo).toBe('/parent/landing');
		service.destroy();
	});

	it('rejects a cyclic route tree instead of recursing forever', () => {
		const service = new RouterService();
		const routes: IRoute[] = [{ path: '', component: 'chain-loop' }];
		routes[0].children = routes;
		service.setRoutes(routes);

		expect(() => service.matchPath('/')).toThrow(/nesting/);
		service.destroy();
	});

	it('runs a lazily loaded child guard before rendering on first navigation', async () => {
		const guard = vi.fn(() => false);
		const element = mountOutlet([
			{ path: '', component: 'chain-home' },
			{
				path: 'lazy',
				component: 'chain-lazy-layout',
				loadChildren: async () => ({
					routes: [{ path: 'secret', component: 'chain-secret', canActivate: [{ canActivate: guard }] }]
				})
			}
		]);
		await settle();

		const result = await router.navigate('/lazy/secret', { scrollToTop: false });
		await settle();

		expect(result.success).toBe(false);
		expect(guard).toHaveBeenCalledTimes(1);
		expect(window.location.pathname).toBe('/');
		expect(element.shadowRoot?.querySelector('chain-lazy-layout')).toBeNull();
	});

	it('renders lazily loaded children through nested outlets when allowed', async () => {
		let loads = 0;
		const element = mountOutlet([
			{ path: '', component: 'chain-home' },
			{
				path: 'lazy',
				component: 'chain-lazy-layout',
				loadChildren: async () => {
					loads++;
					return { routes: [{ path: 'open', component: 'chain-open' }, { path: '', component: 'chain-lazy-default' }] };
				}
			}
		]);
		await settle();

		const result = await router.navigate('/lazy/open', { scrollToTop: false });
		await settle();

		expect(result.success).toBe(true);
		expect(loads).toBe(1);
		const layout = element.shadowRoot?.querySelector('chain-lazy-layout');
		const nested = layout?.shadowRoot?.querySelector('router-outlet');
		expect(nested?.shadowRoot?.querySelector('chain-open')).toBeTruthy();

		// The lazy parent's own default child is matched after loading too.
		const defaultResult = await router.navigate('/lazy', { scrollToTop: false });
		await settle();
		expect(defaultResult.success).toBe(true);
		expect(loads).toBe(1);
		expect(router.getCurrentMatches().map((m) => m.route.component)).toEqual(['chain-lazy-layout', 'chain-lazy-default']);
	});

	it('reports a failed lazy load without committing', async () => {
		mountOutlet([
			{ path: '', component: 'chain-home' },
			{ path: 'broken', component: 'chain-broken', loadChildren: async () => { throw new Error('chunk failed'); } }
		]);
		await settle();

		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const result = await router.navigate('/broken/x', { scrollToTop: false });
			expect(result.success).toBe(false);
			expect(result.error).toMatch(/chunk failed/);
			expect(window.location.pathname).toBe('/');
		} finally {
			spy.mockRestore();
		}
	});

	it('a slow lazy component never overwrites a newer outlet render', async () => {
		const component = new RouterOutletComponent();
		component.elementRef = document.createElement('div');
		component.elementRef.attachShadow({ mode: 'open' });

		let finish!: () => void;
		const slow = (component as any).renderMatch({
			route: { component: 'chain-slow', loadComponent: () => new Promise<void>((resolve) => { finish = resolve; }) }
		});
		await (component as any).renderMatch({ route: { component: 'chain-fast' } });
		finish();
		await slow;

		const rendered = Array.from(component.elementRef.shadowRoot!.children).map((c) => c.tagName);
		expect(rendered).toEqual(['CHAIN-FAST']);
	});

	it('reassigning outlet routes installs the new routes', async () => {
		const element = mountOutlet([{ path: '', component: 'chain-old' }]);
		await settle();

		const newRoutes: IRoute[] = [{ path: '', component: 'chain-new' }];
		(element as any).routes = newRoutes;
		await settle();

		expect(router.getRoutes()).toBe(newRoutes);
		expect(element.shadowRoot?.querySelector('chain-new')).toBeTruthy();
		expect(element.shadowRoot?.querySelector('chain-old')).toBeNull();
	});
});
