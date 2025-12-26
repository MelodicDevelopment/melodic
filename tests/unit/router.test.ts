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
});
