import { describe, it, expect, beforeEach } from 'vitest';
import { RouterService, buildPathFromRoute } from '../../src/routing';
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

	it('matches the ** catch-all route without throwing', () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'home' }, { path: '**' }]);

		// Regression: `**` used to build `new RegExp('^**$')` and throw on first match.
		expect(() => router.matchPath('/anything/here')).not.toThrow();
		const match = router.matchPath('/totally/unknown/path');
		expect(match.isExactMatch).toBe(true);
		expect(match.matches[0]?.route.path).toBe('**');
	});

	it('matches a bare * wildcard and a named *splat', () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'files/*path' }]);

		const match = router.matchPath('/files/a/b/c.txt');
		expect(match.isExactMatch).toBe(true);
		expect(match.params.path).toBe('a/b/c.txt');
	});

	it('URL-decodes route params', () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'users/:name' }]);

		const match = router.matchPath('/users/hello%20world');
		expect(match.params).toEqual({ name: 'hello world' });
	});

	it('strips the query string before matching', () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'list' }]);

		// Regression: an inline query string used to be matched against `^list$`
		// (as `list?page=2`) and fail → 404.
		const match = router.matchPath('/list?page=2');
		expect(match.isExactMatch).toBe(true);
		expect(match.matches[0]?.route.path).toBe('list');
	});

	it('gives guards the target query params, not the previous URL', async () => {
		let seenQuery: string | null = null;
		const guard: IRouteGuard = {
			canActivate: (context) => {
				seenQuery = context.queryParams.get('tab');
				return true;
			}
		};
		const router = new RouterService();
		router.setRoutes([{ path: 'dash', canActivate: [guard] }]);

		// History still points at '/'; the guard must see the TARGET's query.
		await router.navigate('/dash', { queryParams: { tab: 'reports' } });
		expect(seenQuery).toBe('reports');
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

	it('supersedes an older navigation when a newer one starts mid-flight', async () => {
		let releaseSlowGuard: () => void = () => {};
		const slowGate = new Promise<void>((resolve) => {
			releaseSlowGuard = resolve;
		});

		const slowGuard: IRouteGuard = {
			canActivate: async () => {
				await slowGate;
				return true;
			}
		};

		const router = new RouterService();
		router.setRoutes([{ path: 'slow', canActivate: [slowGuard] }, { path: 'fast' }]);

		const slowNav = router.navigate('/slow'); // parks in the async guard
		await Promise.resolve();
		const fastNav = router.navigate('/fast'); // newer navigation supersedes it

		const fastResult = await fastNav;
		releaseSlowGuard();
		const slowResult = await slowNav;

		expect(fastResult.success).toBe(true);
		expect(slowResult.success).toBe(false);
		expect(window.location.pathname).toBe('/fast');
	});

	it('navigateByName collapses empty segments from unfilled params', async () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'items/:a/:b', name: 'item' }]);

		const result = await router.navigateByName('item', { b: '5' });
		expect(result.url).not.toContain('//');
	});

	it(':param does not match an empty segment', () => {
		const router = new RouterService();
		router.setRoutes([{ path: ':id' }]);

		// Regression: `:id` compiled to `([^/]*)` and matched the root URL
		// with `id === ''`.
		const rootMatch = router.matchPath('/');
		expect(rootMatch.matches).toHaveLength(0);
		expect(rootMatch.isExactMatch).toBe(false);

		const realMatch = router.matchPath('/42');
		expect(realMatch.isExactMatch).toBe(true);
		expect(realMatch.params).toEqual({ id: '42' });
	});

	it('backtracks to a later sibling when a prefix-matched parent has no matching child', () => {
		const router = new RouterService();
		router.setRoutes([
			{ path: 'a', children: [{ path: 'b' }] },
			{ path: ':x', children: [{ path: 'c' }] }
		]);

		// Regression: `a` prefix-matched `/a/c`, its child `b` failed, and the
		// matcher returned that failure without ever trying `:x`.
		const match = router.matchPath('/a/c');
		expect(match.isExactMatch).toBe(true);
		expect(match.params).toEqual({ x: 'a' });
		expect(match.matches.map((m) => m.route.path)).toEqual([':x', 'c']);
	});

	it('keeps the partial parent match when no sibling matches either', () => {
		const router = new RouterService();
		router.setRoutes([
			{ path: 'a', children: [{ path: 'b' }] },
			{ path: 'z', children: [{ path: 'c' }] }
		]);

		// Nested outlets rely on the partial match to render the parent layout
		// plus a nested 404 view.
		const match = router.matchPath('/a/nope');
		expect(match.isExactMatch).toBe(false);
		expect(match.matches.map((m) => m.route.path)).toEqual(['a']);
	});

	it('URL-encodes params when building paths and round-trips them', async () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'users/:name', name: 'user' }]);

		const result = await router.navigateByName('user', { name: 'hello world/x' });
		expect(result.url).toBe('/users/hello%20world%2Fx');

		// Round trip: matching the built URL decodes back to the original value.
		const match = router.matchPath(result.url!);
		expect(match.params).toEqual({ name: 'hello world/x' });
	});

	it('does not mangle $-sequences in param values', () => {
		// Regression: plain String.replace treated `$&` in the VALUE as a
		// replacement pattern.
		const path = buildPathFromRoute([{ path: 'users/:name', name: 'user' }], 'user', { name: 'pri$&ce' });
		expect(path).toBe('/users/pri%24%26ce');
	});

	it('encodes splat params per segment, preserving their slashes', () => {
		const path = buildPathFromRoute([{ path: 'files/*path', name: 'file' }], 'file', { path: 'a b/c d' });
		expect(path).toBe('/files/a%20b/c%20d');
	});

	it('merges queryParams into a path that already has a query string', async () => {
		const router = new RouterService();
		router.setRoutes([{ path: 'list' }]);

		// Regression: produced `/list?page=2?sort=asc`.
		const result = await router.navigate('/list?page=2', { queryParams: { sort: 'asc' } });
		expect(result.url).toBe('/list?page=2&sort=asc');
		expect(window.location.search).toBe('?page=2&sort=asc');
	});
});
