import { describe, it, expect, beforeEach } from 'vitest';
import { RouterService } from '../../src/routing';
import type { IRouteGuard } from '../../src/routing/interfaces/iroute-guard.interface';
import type { IRouteResolver } from '../../src/routing/interfaces/iroute-resolver.interface';


describe('router service', () => {
	beforeEach(() => {
		history.replaceState(null, '', '/');
	});

	it('blocks navigation when canActivate guard returns false', async () => {
		const guard: IRouteGuard = {
			canActivate: () => false
		};
		const router = new RouterService();
		router.setRoutes([{ path: 'home', canActivate: [guard] }]);

		const result = await router.navigate('/home');
		expect(result.success).toBe(false);
		expect(window.location.pathname).toBe('/');
	});

	it('runs resolvers and stores resolved data', async () => {
		const resolver: IRouteResolver = {
			resolve: () => 'ready'
		};
		const router = new RouterService();
		router.setRoutes([{ path: 'home', resolve: { status: resolver } }]);

		history.replaceState(null, '', '/home');
		const matchResult = router.matchPath('/home');
		router.setCurrentMatches(matchResult);

		const result = await router.runResolvers(matchResult);
		expect(result.success).toBe(true);
		expect(router.getResolvedData()).toEqual({ status: 'ready' });
	});

	it('matches params and redirects', () => {
		const router = new RouterService();
		router.setRoutes([
			{ path: 'users/:id' },
			{ path: 'old', redirectTo: '/new' }
		]);

		const match = router.matchPath('/users/42');
		expect(match.params).toEqual({ id: '42' });
		expect(match.isExactMatch).toBe(true);

		const redirectMatch = router.matchPath('/old');
		expect(redirectMatch.redirectTo).toBe('/new');
	});

	it('substitutes parent params into a relative child redirect', () => {
		const router = new RouterService();
		router.setRoutes([
			{
				path: 'people/:id',
				children: [
					{ path: '', redirectTo: 'activity' },
					{ path: 'activity' }
				]
			}
		]);

		const match = router.matchPath('/people/69');
		expect(match.redirectTo).toBe('/people/69/activity');
	});

	it('substitutes parent params into a multi-segment relative redirect', () => {
		const router = new RouterService();
		router.setRoutes([
			{
				path: 'people/:id',
				children: [
					{ path: '', redirectTo: 'tabs/main' },
					{ path: 'tabs/main' }
				]
			}
		]);

		const match = router.matchPath('/people/69');
		expect(match.redirectTo).toBe('/people/69/tabs/main');
	});

	it('substitutes multiple parent params into a relative redirect', () => {
		const router = new RouterService();
		router.setRoutes([
			{
				path: 'users/:userId',
				children: [
					{
						path: 'posts/:postId',
						children: [
							{ path: '', redirectTo: 'view' },
							{ path: 'view' }
						]
					}
				]
			}
		]);

		const match = router.matchPath('/users/12/posts/34');
		expect(match.redirectTo).toBe('/users/12/posts/34/view');
	});

	it('getParam returns updated params during NavigationEvent', async () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'events/:id' }]);

		// Navigate to the first route to establish initial params
		await router.navigate('/events/15');
		expect(router.getParam('id')).toBe('15');

		// Listen for NavigationEvent and capture params at the moment it fires
		let paramDuringEvent: string | undefined;
		const listener = () => {
			paramDuringEvent = router.getParam('id');
		};
		window.addEventListener('NavigationEvent', listener);

		await router.navigate('/events/3');

		window.removeEventListener('NavigationEvent', listener);
		expect(paramDuringEvent).toBe('3');
		expect(router.getParam('id')).toBe('3');
	});

	it('blocks navigation when canDeactivate guard returns false', async () => {
		const guard: IRouteGuard = {
			canDeactivate: () => false
		};
		const router = new RouterService();
		router.setRoutes([
			{ path: 'page', canDeactivate: [guard] },
			{ path: 'other' }
		]);

		history.replaceState(null, '', '/page');
		const currentMatch = router.matchPath('/page');
		router.setCurrentMatches(currentMatch);

		const result = await router.navigate('/other');
		expect(result.success).toBe(false);
		expect(window.location.pathname).toBe('/page');
	});

	it('redirected navigation preserves the previous history entry', async () => {
		// Regression: a default-child redirect (e.g. `/people/:id` →
		// `/people/:id/activity`) used to force `replace: true` on the
		// recursive navigate call. Because the source URL was never pushed,
		// that replaceState landed on the CURRENT entry — the page the user
		// came from — erasing it from history. Hitting Back then skipped
		// straight past the previous page.
		const router = new RouterService();
		router.setRoutes([
			{ path: 'list' },
			{
				path: 'detail/:id',
				children: [
					{ path: '', redirectTo: 'tab' },
					{ path: 'tab' }
				]
			}
		]);

		await router.navigate('/list');
		const lengthAfterList = history.length;

		await router.navigate('/detail/42');

		expect(window.location.pathname).toBe('/detail/42/tab');
		// The redirect must push a new entry, not replace the /list entry.
		expect(history.length).toBe(lengthAfterList + 1);
	});
});
