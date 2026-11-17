import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Injector } from '../../src/injection';
import { RouterService } from '../../src/routing';
import '../../src/routing/components/router-outlet/router-outlet.component';
import { routerLinkDirective } from '../../src/routing/directives/router-link.directive';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import type { IRoute } from '../../src/routing/interfaces/iroute.interface';
import type { IRouteChange } from '../../src/routing/interfaces/iroute-change.interface';

const INDEX_KEY = '__melodicHistoryIndex';

class FixLayout {}
MelodicComponent({
	selector: 'fix-layout',
	template: () => html`<div><router-outlet></router-outlet></div>`
})(FixLayout);

const routeChanges: string[] = [];
class FixSearch {
	public onRouteChange(change: IRouteChange): void {
		routeChanges.push(change.queryParams.toString());
	}
}
MelodicComponent({ selector: 'fix-search', template: () => html`<p>search</p>` })(FixSearch);

class FixAnchored {}
MelodicComponent({ selector: 'fix-anchored', template: () => html`<h2 id="deep-anchor">deep</h2>` })(FixAnchored);

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function settle(rounds: number = 8): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await tick();
	}
}

function historyIndex(state: unknown = history.state): number | undefined {
	return (state as Record<string, number> | null)?.[INDEX_KEY];
}

describe('router fixes (2026-11 review)', () => {
	const router = Injector.get(RouterService);
	let outlet: HTMLElement | null = null;

	function mountOutlet(routes: IRoute[]): HTMLElement {
		const element = document.createElement('router-outlet');
		document.body.appendChild(element);
		(element as unknown as { routes: IRoute[] }).routes = routes;
		outlet = element;
		return element;
	}

	beforeEach(() => {
		history.replaceState(null, '', '/');
		routeChanges.length = 0;
	});

	afterEach(async () => {
		await router.navigate('/', { skipGuards: true, skipResolvers: true });
		outlet?.remove();
		outlet = null;
		await settle(2);
		vi.restoreAllMocks();
	});

	it('a popstate that supersedes a pending navigate() does not leave its query params behind', async () => {
		let release!: (value: boolean) => void;
		const seenByGuard: string[] = [];

		mountOutlet([
			{ path: '', component: 'fix-home' },
			{
				path: 'a',
				component: 'fix-a',
				canActivate: [{ canActivate: (context) => (seenByGuard.push(`${context.targetPath}?${context.queryParams.toString()}`), true) }]
			},
			{
				path: 'slow',
				component: 'fix-slow',
				canActivate: [{ canActivate: () => new Promise<boolean>((resolve) => (release = resolve)) }]
			}
		]);
		await settle();

		const pending = router.navigate('/slow?x=1');
		await settle(2);

		// The user presses back/forward while the guard is still pending.
		history.replaceState(null, '', '/a?y=2');
		window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
		await settle();

		release(true);
		expect((await pending).success).toBe(false);
		await settle();

		expect(seenByGuard).toEqual(['/a?y=2']);
		expect(router.getQueryParams().toString()).toBe('y=2');
		expect(router.queryParams().toString()).toBe('y=2');
	});

	it('a nested outlet clears its child when the matched chain gets shorter', async () => {
		const element = mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'settings', component: 'fix-layout', children: [{ path: 'profile', component: 'fix-profile' }] }
		]);
		await settle();

		await router.navigate('/settings/profile');
		await settle();

		const layout = element.shadowRoot!.querySelector('fix-layout')!;
		const inner = layout.shadowRoot!.querySelector('router-outlet')!;
		expect(inner.shadowRoot!.querySelector('fix-profile')).toBeTruthy();

		await router.navigate('/settings');
		await settle();

		expect(window.location.pathname).toBe('/settings');
		expect(element.shadowRoot!.querySelector('fix-layout')).toBe(layout);
		expect(inner.shadowRoot!.querySelector('fix-profile')).toBeNull();

		// …and it comes back.
		await router.navigate('/settings/profile');
		await settle();
		expect(inner.shadowRoot!.querySelector('fix-profile')).toBeTruthy();
	});

	it('a route-level redirect keeps the query string and fragment', async () => {
		mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'old', redirectTo: '/new' },
			{ path: 'pinned', redirectTo: '/new?fixed=1' },
			{ path: 'new', component: 'fix-new' }
		]);
		await settle();

		await router.navigate('/old?code=abc#frag');
		await settle();
		expect(`${location.pathname}${location.search}${location.hash}`).toBe('/new?code=abc#frag');
		expect(router.queryParams().get('code')).toBe('abc');

		await router.navigate('/old', { queryParams: { tab: 'users' } });
		await settle();
		expect(`${location.pathname}${location.search}`).toBe('/new?tab=users');

		// A target that declares its own query keeps it.
		await router.navigate('/pinned?code=abc');
		await settle();
		expect(`${location.pathname}${location.search}`).toBe('/new?fixed=1');
	});

	it('a splat in redirectTo keeps its slashes', async () => {
		mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'legacy/*rest', redirectTo: '/docs/*rest' },
			{ path: 'docs/*rest', component: 'fix-docs' }
		]);
		await settle();

		await router.navigate('/legacy/a/b c');
		await settle();

		expect(location.pathname).toBe('/docs/a/b%20c');
		expect(router.params()).toEqual({ rest: 'a/b c' });
	});

	it('onRouteChange fires for a query-only change, once per change', async () => {
		mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'search', component: 'fix-search' }
		]);
		await settle();

		await router.navigate('/search?q=a');
		await settle();
		expect(routeChanges).toEqual([]);

		await router.navigate('/search?q=b');
		await settle();
		expect(routeChanges).toEqual(['q=b']);

		// Same URL again: nothing changed, nothing fires.
		await router.navigate('/search?q=b');
		await settle();
		expect(routeChanges).toEqual(['q=b']);
	});

	it('onRouteChange fires when a reload re-runs the resolvers', async () => {
		let runs = 0;
		mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'search', component: 'fix-search', resolve: { n: { resolve: () => ++runs } } }
		]);
		await settle();

		await router.navigate('/search');
		await settle();
		await router.navigate('/search', { onSameUrlNavigation: 'reload', replace: true });
		await settle();

		expect(runs).toBe(2);
		expect(routeChanges.length).toBe(1);
	});

	it('stamps the initial history entry, so a blocked back to it steps forward instead of overwriting it', async () => {
		mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'b', component: 'fix-b', canDeactivate: [{ canDeactivate: () => false }] }
		]);
		await settle();
		// The shared router already committed a route in an earlier test, so the
		// outlet does not start one itself; run the page-load navigation by hand.
		await router.initialNavigation();
		await settle();

		const initialState: unknown = history.state;
		const initialIndex = historyIndex(initialState);
		expect(typeof initialIndex).toBe('number');

		await router.navigate('/b');
		await settle();
		const bState: unknown = history.state;
		expect(historyIndex(bState)).toBe(initialIndex! + 1);

		// Simulate the browser moving back to the initial entry.
		const go = vi.spyOn(history, 'go').mockImplementation(() => undefined);
		history.replaceState(initialState, '', '/');
		const replace = vi.spyOn(history, 'replaceState');
		window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
		await settle();

		expect(go).toHaveBeenCalledWith(1);
		expect(replace).not.toHaveBeenCalled();

		// Deliver the popstate the corrective history.go(1) would have produced.
		go.mockRestore();
		replace.mockRestore();
		history.replaceState(bState, '', '/b');
		window.dispatchEvent(new PopStateEvent('popstate', { state: bState }));
		await settle(2);
	});

	it('a canDeactivate redirect during popstate stamps the entry the browser moved to', async () => {
		mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'a', component: 'fix-a', canDeactivate: [{ canDeactivate: () => '/c' }] },
			{ path: 'c', component: 'fix-c' }
		]);
		await settle();
		// The shared router already committed a route in an earlier test, so the
		// outlet does not start one itself; run the page-load navigation by hand.
		await router.initialNavigation();
		await settle();

		const initialState: unknown = history.state;
		const initialIndex = historyIndex(initialState)!;

		await router.navigate('/a');
		await settle();
		expect(historyIndex()).toBe(initialIndex + 1);

		history.replaceState(initialState, '', '/');
		window.dispatchEvent(new PopStateEvent('popstate', { state: initialState }));
		await settle();

		expect(location.pathname).toBe('/c');
		expect(historyIndex()).toBe(initialIndex);
	});

	it('navigate() treats a scheme-less path as root-relative and refuses another origin', async () => {
		mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'users/:id', component: 'fix-user' },
			{ path: 'about', component: 'fix-about' }
		]);
		await settle();

		await router.navigate('/users/1');
		await settle();

		const relative = await router.navigate('about');
		await settle();
		expect(relative.success).toBe(true);
		expect(location.pathname).toBe('/about');

		const sameOrigin = await router.navigate(`${location.origin}/users/2?x=1`);
		await settle();
		expect(sameOrigin.success).toBe(true);
		expect(`${location.pathname}${location.search}`).toBe('/users/2?x=1');

		const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const push = vi.spyOn(history, 'pushState');
		const external = await router.navigate('https://elsewhere.example/x');

		expect(external.success).toBe(false);
		expect(external.error).toContain('external URL');
		expect(push).not.toHaveBeenCalled();
		expect(errors).toHaveBeenCalled();
		expect(location.pathname).toBe('/users/2');
	});

	it('a router link to another origin is left to the browser; a relative href is root-relative', async () => {
		mountOutlet([{ path: '', component: 'fix-home' }]);
		await settle();

		const navigate = vi.spyOn(router, 'navigate');
		let prevented: boolean | null = null;
		const observe = (event: Event): void => {
			prevented = event.defaultPrevented;
			event.preventDefault();
		};
		document.body.addEventListener('click', observe);

		const external = document.createElement('a');
		document.body.appendChild(external);
		const cleanupExternal = routerLinkDirective(external, 'https://elsewhere.example/x', 'routerLink');
		external.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

		expect(prevented).toBe(false);
		expect(navigate).not.toHaveBeenCalled();
		expect(external.getAttribute('href')).toBe('https://elsewhere.example/x');

		const relative = document.createElement('a');
		document.body.appendChild(relative);
		const cleanupRelative = routerLinkDirective(relative, { href: 'about', queryParams: { q: '1' } }, 'routerLink');
		expect(relative.getAttribute('href')).toBe('/about?q=1');

		relative.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
		expect(prevented).toBe(true);
		expect(navigate).toHaveBeenCalledTimes(1);

		document.body.removeEventListener('click', observe);
		if (cleanupExternal) cleanupExternal();
		if (cleanupRelative) cleanupRelative();
		external.remove();
		relative.remove();
		await settle();
	});

	it('hash navigation still finds an anchor inside nested shadow roots', async () => {
		const element = mountOutlet([
			{ path: '', component: 'fix-home' },
			{ path: 'page', component: 'fix-anchored' }
		]);
		await settle();

		const scrolled: Element[] = [];
		const original = Element.prototype.scrollIntoView;
		Element.prototype.scrollIntoView = function (this: Element): void {
			scrolled.push(this);
		};

		try {
			await router.navigate('/page#deep-anchor');
			await settle();
			await new Promise((resolve) => setTimeout(resolve, 40));

			const anchor = element.shadowRoot!.querySelector('fix-anchored')!.shadowRoot!.querySelector('#deep-anchor');
			expect(anchor).toBeTruthy();
			expect(scrolled).toContain(anchor);
		} finally {
			Element.prototype.scrollIntoView = original;
		}
	});
});
