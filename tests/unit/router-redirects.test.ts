import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RouterService } from '../../src/routing/services/router.service';
import type { IRoute } from '../../src/routing/interfaces/iroute.interface';
import type { IGuardContext } from '../../src/routing/interfaces/iguard-context.interface';
import type { INavigationEvent } from '../../src/routing/interfaces/inavigation-event.interface';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Review findings S1, S2, S5, S6, S7, S8, S18.
 *
 * The through-line: a redirect used to be a fresh navigation with
 * `skipGuards: true` and the caller's options attached, so it could walk
 * straight into a protected route carrying the wrong query string, and a
 * cyclic pair of redirects recursed until the heap died.
 */
describe('router redirects', () => {
	let router: RouterService;
	let errorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		history.replaceState(null, '', '/');
		router = new RouterService();
		errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		router.destroy();
		errorSpy.mockRestore();
	});

	it('runs the redirect target’s guards (S1)', async () => {
		const seen: string[] = [];

		const routes: IRoute[] = [
			{
				path: 'public',
				component: 'x-public',
				canActivate: [
					{
						canActivate: () => {
							seen.push('public');
							return '/admin';
						}
					}
				]
			},
			{
				path: 'admin',
				component: 'x-admin',
				canActivate: [
					{
						canActivate: () => {
							seen.push('admin');
							return false;
						}
					}
				]
			}
		];

		router.setRoutes(routes);

		const result = await router.navigate('/public');

		expect(seen).toEqual(['public', 'admin']);
		expect(result.success).toBe(false);
		expect(result.error).toBe('Navigation blocked by guard');
	});

	it('does not carry the caller’s query params into a guard redirect (S7)', async () => {
		let seenTarget = '';

		router.setRoutes([
			{
				path: 'users',
				component: 'x-users',
				canActivate: [{ canActivate: () => '/login' }]
			},
			{
				path: 'login',
				component: 'x-login',
				canActivate: [
					{
						canActivate: (context: IGuardContext) => {
							seenTarget = `${context.targetPath}?${context.queryParams.toString()}`;
							return true;
						}
					}
				]
			}
		]);

		await router.navigate('/users', { queryParams: { tab: 'users' } });

		expect(seenTarget).toBe('/login?');
		expect(window.location.pathname).toBe('/login');
		expect(window.location.search).toBe('');
	});

	it('bounds a redirect cycle instead of recursing forever (S2)', async () => {
		router.setRoutes([
			{ path: 'a', redirectTo: '/b' },
			{ path: 'b', redirectTo: '/a' }
		]);

		const result = await router.navigate('/a');

		expect(result.success).toBe(false);
		expect(result.error).toMatch(/Redirect limit \(10\) exceeded/);
		expect(result.error).toContain('→');
	});

	it('bounds a route that redirects to itself (S2)', async () => {
		router.setRoutes([{ path: 'loop', redirectTo: 'loop' }]);

		const result = await router.navigate('/loop');

		expect(result.success).toBe(false);
		expect(result.error).toMatch(/Redirect limit/);
	});

	it('substitutes params into a parametrised redirectTo (S6)', async () => {
		router.setRoutes([
			{ path: 'u/:id', redirectTo: '/users/:id' },
			{ path: 'users/:id', component: 'x-user' }
		]);

		const result = await router.navigate('/u/7');

		expect(result.success).toBe(true);
		expect(window.location.pathname).toBe('/users/7');
		expect(router.getParam('id')).toBe('7');
	});

	it('asks a deactivation guard once per navigation, not once per hop', async () => {
		let asked = 0;

		router.setRoutes([
			{
				path: 'edit',
				component: 'x-edit',
				canDeactivate: [
					{
						canDeactivate: () => {
							asked++;
							return '/confirm';
						}
					}
				]
			},
			{ path: 'confirm', component: 'x-confirm' },
			{ path: 'away', component: 'x-away' }
		]);

		await router.navigate('/edit');
		const result = await router.navigate('/away');

		expect(asked).toBe(1);
		expect(result.success).toBe(true);
		expect(window.location.pathname).toBe('/confirm');
	});

	it('puts query params before the fragment (S5)', async () => {
		router.setRoutes([{ path: 'docs', component: 'x-docs' }]);

		const result = await router.navigate('/docs#intro', { queryParams: { q: '1' } });

		expect(result.url).toBe('/docs?q=1#intro');
		expect(window.location.search).toBe('?q=1');
		expect(window.location.hash).toBe('#intro');
	});

	it('ignores a repeat navigation to the same URL (S8)', async () => {
		let resolved = 0;

		router.setRoutes([
			{
				path: 'list',
				component: 'x-list',
				resolve: {
					items: {
						resolve: () => {
							resolved++;
							return [];
						}
					}
				}
			}
		]);

		await router.navigate('/list');
		const lengthAfterFirst = history.length;

		await router.navigate('/list');

		expect(resolved).toBe(1);
		expect(history.length).toBe(lengthAfterFirst);

		await router.navigate('/list', { onSameUrlNavigation: 'reload' });
		expect(resolved).toBe(2);
	});

	it('emits a navigation lifecycle event stream (S18)', async () => {
		const events: INavigationEvent[] = [];
		router.events.subscribe((event) => {
			if (event) {
				events.push(event);
			}
		});

		router.setRoutes([
			{ path: 'from', component: 'x-from', canActivate: [{ canActivate: () => '/to' }] },
			{ path: 'to', component: 'x-to' }
		]);

		await router.navigate('/from');
		await tick();

		const types = events.map((event) => event.type);
		expect(types).toContain('start');
		expect(types).toContain('redirect');
		expect(types[types.length - 1]).toBe('end');

		const redirect = events.find((event) => event.type === 'redirect');
		expect(redirect?.redirectTo).toBe('/to');

		const end = events[events.length - 1];
		expect(end.result?.matches[0].route.path).toBe('to');
	});

	it('exposes params and resolved data as signals (S4)', async () => {
		router.setRoutes([
			{
				path: 'users/:id',
				component: 'x-user',
				resolve: { user: { resolve: (context) => `user-${context.params.id}` } }
			}
		]);

		await router.navigate('/users/1');
		expect(router.params().id).toBe('1');
		expect(router.resolvedData().user).toBe('user-1');

		const seen: string[] = [];
		router.params.subscribe((params) => seen.push(params.id));

		await router.navigate('/users/2');
		expect(router.params().id).toBe('2');
		expect(router.resolvedData().user).toBe('user-2');
		expect(seen).toContain('2');
	});

	it('runs the resolvers of one route concurrently (S16)', async () => {
		const order: string[] = [];
		const slow = (name: string, delay: number) => ({
			resolve: async () => {
				await new Promise((resolve) => setTimeout(resolve, delay));
				order.push(name);
				return name;
			}
		});

		router.setRoutes([
			{
				path: 'dash',
				component: 'x-dash',
				resolve: { a: slow('a', 20), b: slow('b', 1) }
			}
		]);

		await router.navigate('/dash');

		// Serial execution would finish 'a' first because it is declared first.
		expect(order).toEqual(['b', 'a']);
		expect(router.getResolvedData()).toEqual({ a: 'a', b: 'b' });
	});
});

/**
 * Review findings S8 (hash-only popstate) and S9 (a blocked back overwriting
 * the wrong history entry). The router stamps its own index onto
 * `history.state` so a block can step back by the right delta.
 */
describe('router history handling', () => {
	let router: RouterService;

	beforeEach(() => {
		history.replaceState(null, '', '/');
		router = new RouterService();
	});

	afterEach(() => {
		router.destroy();
	});

	it('stamps a monotonic index onto history state', async () => {
		router.setRoutes([
			{ path: 'a', component: 'x-a' },
			{ path: 'b', component: 'x-b' }
		]);

		await router.navigate('/a');
		const first = (history.state as Record<string, unknown>).__melodicHistoryIndex;

		await router.navigate('/b');
		const second = (history.state as Record<string, unknown>).__melodicHistoryIndex;

		expect(typeof first).toBe('number');
		expect(second).toBe((first as number) + 1);
	});

	it('preserves caller data alongside the index', async () => {
		router.setRoutes([{ path: 'a', component: 'x-a' }]);

		await router.navigate('/a', { data: { from: 'test' } });

		expect((history.state as Record<string, unknown>).from).toBe('test');
		expect(typeof (history.state as Record<string, unknown>).__melodicHistoryIndex).toBe('number');
	});

	it('does not re-run the pipeline for a hash-only popstate (S8)', async () => {
		let resolved = 0;

		router.setRoutes([
			{
				path: 'doc',
				component: 'x-doc',
				resolve: { body: { resolve: () => ++resolved } }
			}
		]);

		await router.navigate('/doc');
		expect(resolved).toBe(1);

		history.replaceState(history.state, '', '/doc#section');
		window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
		await tick();

		expect(resolved).toBe(1);
	});
});
