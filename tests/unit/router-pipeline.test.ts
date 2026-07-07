import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Injector } from '../../src/injection';
import { RouterService } from '../../src/routing';
// Importing the outlet module registers the <router-outlet> custom element.
import '../../src/routing/components/router-outlet/router-outlet.component';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import type { IRoute } from '../../src/routing/interfaces/iroute.interface';

// A layout component hosting a nested <router-outlet> in its shadow root.
class PipeAdminLayout {}
MelodicComponent({
	selector: 'pipe-admin-layout',
	template: () => html`<div class="layout"><router-outlet></router-outlet></div>`
})(PipeAdminLayout);

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function settle(rounds: number = 6): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await tick();
	}
}

/**
 * These tests exercise the consolidated router pipeline: RouterService owns
 * match → guards → resolvers → commit (for programmatic navigation, initial
 * load AND popstate) while outlets are dumb renderers reacting to the
 * committed-route signal.
 */
describe('router pipeline (service-owned, outlets as renderers)', () => {
	// The outlet resolves RouterService through the global injector, so use
	// the same singleton the outlets see.
	const router = Injector.get(RouterService);
	let outlet: HTMLElement | null = null;

	function mountOutlet(routes: IRoute[]): HTMLElement {
		const element = document.createElement('router-outlet');
		document.body.appendChild(element);
		// Property lands before the outlet's deferred (microtask) initialization.
		(element as any).routes = routes;
		outlet = element;
		return element;
	}

	beforeEach(() => {
		history.replaceState(null, '', '/');
	});

	afterEach(() => {
		outlet?.remove();
		outlet = null;
	});

	it('runs canActivate guards exactly once per programmatic navigation', async () => {
		let guardCalls = 0;

		const element = mountOutlet([
			{ path: '', component: 'pipe-home' },
			{
				path: 'guarded',
				component: 'pipe-guarded',
				canActivate: [{ canActivate: () => (guardCalls++, true) }]
			}
		]);

		await settle();
		expect(guardCalls).toBe(0);

		const result = await router.navigate('/guarded');
		await settle();

		expect(result.success).toBe(true);
		// Regression: the outlet used to re-run guards on NavigationEvent,
		// doubling every guard invocation per navigation.
		expect(guardCalls).toBe(1);
		expect(element.shadowRoot?.querySelector('pipe-guarded')).toBeTruthy();
	});

	it('runs resolvers exactly once per navigation, every navigation', async () => {
		let resolveCalls = 0;

		mountOutlet([
			{ path: '', component: 'pipe-home' },
			{ path: 'other', component: 'pipe-other' },
			{
				path: 'data',
				component: 'pipe-data',
				resolve: { value: { resolve: () => (resolveCalls++, `v${resolveCalls}`) } }
			}
		]);

		await settle();

		await router.navigate('/data');
		await settle();
		expect(resolveCalls).toBe(1);
		expect(router.getResolvedData()).toEqual({ value: 'v1' });

		// Re-visiting the same path later must re-run resolvers (the old
		// string-comparison skip-flag is gone).
		await router.navigate('/other');
		await settle();
		await router.navigate('/data');
		await settle();
		expect(resolveCalls).toBe(2);
	});

	it('runs canActivate guards exactly once on popstate (no bypass, no double-run)', async () => {
		let guardCalls = 0;

		const element = mountOutlet([
			{ path: '', component: 'pipe-home' },
			{ path: 'free', component: 'pipe-free' },
			{
				path: 'pop-guarded',
				component: 'pipe-pop-guarded',
				canActivate: [{ canActivate: () => (guardCalls++, true) }]
			}
		]);

		await settle();
		await router.navigate('/free');
		await settle();
		expect(guardCalls).toBe(0);

		// Simulate back/forward: the URL changes first, then popstate fires.
		history.pushState({}, '', '/pop-guarded');
		window.dispatchEvent(new PopStateEvent('popstate'));
		await settle();

		expect(guardCalls).toBe(1);
		expect(element.shadowRoot?.querySelector('pipe-pop-guarded')).toBeTruthy();
	});

	it('reverts the URL when a canActivate guard blocks a popstate navigation', async () => {
		const element = mountOutlet([
			{ path: '', component: 'pipe-home' },
			{ path: 'free', component: 'pipe-free' },
			{
				path: 'blocked',
				component: 'pipe-blocked',
				canActivate: [{ canActivate: () => false }]
			}
		]);

		await settle();
		await router.navigate('/free');
		await settle();

		history.pushState({}, '', '/blocked');
		window.dispatchEvent(new PopStateEvent('popstate'));
		await settle();

		// Regression: popstate used to bypass canActivate guards entirely.
		expect(window.location.pathname).toBe('/free');
		expect(element.shadowRoot?.querySelector('pipe-blocked')).toBeNull();
		expect(element.shadowRoot?.querySelector('pipe-free')).toBeTruthy();
	});

	it('runs popstate resolvers once and renders the target', async () => {
		let resolveCalls = 0;

		const element = mountOutlet([
			{ path: '', component: 'pipe-home' },
			{ path: 'free', component: 'pipe-free' },
			{
				path: 'pop-data',
				component: 'pipe-pop-data',
				resolve: { value: { resolve: () => (resolveCalls++, 'pop') } }
			}
		]);

		await settle();
		await router.navigate('/free');
		await settle();

		history.pushState({}, '', '/pop-data');
		window.dispatchEvent(new PopStateEvent('popstate'));
		await settle();

		expect(resolveCalls).toBe(1);
		expect(router.getResolvedData()).toEqual({ value: 'pop' });
		expect(element.shadowRoot?.querySelector('pipe-pop-data')).toBeTruthy();
	});

	it('still renders nested outlets for child routes', async () => {
		let guardCalls = 0;

		const element = mountOutlet([
			{ path: '', component: 'pipe-home' },
			{
				path: 'admin',
				component: 'pipe-admin-layout',
				canActivate: [{ canActivate: () => (guardCalls++, true) }],
				children: [
					{ path: 'users', component: 'pipe-admin-users' },
					{ path: 'settings', component: 'pipe-admin-settings' }
				]
			}
		]);

		await settle();
		await router.navigate('/admin/users');
		await settle();

		const layout = element.shadowRoot?.querySelector('pipe-admin-layout');
		expect(layout).toBeTruthy();
		// Guards for the whole matched branch run once, in the service.
		expect(guardCalls).toBe(1);

		const nestedOutlet = layout?.shadowRoot?.querySelector('router-outlet');
		expect(nestedOutlet).toBeTruthy();
		expect(nestedOutlet?.shadowRoot?.querySelector('pipe-admin-users')).toBeTruthy();

		// Navigate between siblings: the parent layout stays, the child swaps.
		await router.navigate('/admin/settings');
		await settle();

		expect(guardCalls).toBe(2);
		const nestedOutletAfter = element.shadowRoot?.querySelector('pipe-admin-layout')?.shadowRoot?.querySelector('router-outlet');
		expect(nestedOutletAfter?.shadowRoot?.querySelector('pipe-admin-settings')).toBeTruthy();
		expect(nestedOutletAfter?.shadowRoot?.querySelector('pipe-admin-users')).toBeNull();
	});

	it('does not commit a navigation blocked by a guard', async () => {
		const element = mountOutlet([
			{ path: '', component: 'pipe-home' },
			{
				path: 'denied',
				component: 'pipe-denied',
				canActivate: [{ canActivate: () => false }]
			}
		]);

		await settle();

		const result = await router.navigate('/denied');
		await settle();

		expect(result.success).toBe(false);
		expect(window.location.pathname).toBe('/');
		expect(element.shadowRoot?.querySelector('pipe-denied')).toBeNull();
	});

	// Regression: resolver output used to be written into the route context
	// incrementally across awaits, so a slow, superseded navigation could
	// clear or overwrite the resolved data of the navigation that won.
	it('a superseded navigation does not overwrite the winning navigation\'s resolved data', async () => {
		let releaseSlow!: (value: string) => void;
		const slowPromise = new Promise<string>((resolve) => {
			releaseSlow = resolve;
		});

		mountOutlet([
			{ path: '', component: 'pipe-home' },
			{
				path: 'slow',
				component: 'pipe-slow',
				resolve: { value: { resolve: () => slowPromise } }
			},
			{
				path: 'fast',
				component: 'pipe-fast',
				resolve: { value: { resolve: () => 'fast' } }
			}
		]);

		await settle();

		// Start the slow navigation; its resolver parks on slowPromise.
		const slowNav = router.navigate('/slow');
		await tick();

		// A newer navigation supersedes it and wins.
		const fastResult = await router.navigate('/fast');
		expect(fastResult.success).toBe(true);
		expect(router.getResolvedData()).toEqual({ value: 'fast' });

		// The loser's resolver completing must not touch the committed data.
		releaseSlow('slow');
		const slowResult = await slowNav;
		expect(slowResult.success).toBe(false);
		expect(slowResult.error).toBe('Navigation superseded');
		expect(window.location.pathname).toBe('/fast');
		expect(router.getResolvedData()).toEqual({ value: 'fast' });
	});
});
