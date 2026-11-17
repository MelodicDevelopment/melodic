import { describe, it, expect, vi } from 'vitest';
import { bootstrap } from '../../src/bootstrap';
import { Injector } from '../../src/injection';
import { RouterService, provideRouter } from '../../src/routing';

describe('bootstrap teardown (2026-11 review)', () => {
	it('app.destroy() releases the router window listeners and scroll restoration', async () => {
		history.scrollRestoration = 'auto';
		const add = vi.spyOn(window, 'addEventListener');
		const remove = vi.spyOn(window, 'removeEventListener');

		// A router resolved before bootstrap would already hold its listeners.
		Injector.getBinding(RouterService)?.clearInstance();

		const app = await bootstrap({ devMode: false, providers: [provideRouter([{ path: '', component: 'x-home' }])] });
		const router = Injector.get(RouterService);

		const added = add.mock.calls.filter(([type]) => type === 'popstate' || type === 'NavigationEvent');
		expect(added.length).toBe(2);
		expect(history.scrollRestoration).toBe('manual');

		app.destroy();

		for (const [type, listener] of added) {
			expect(remove).toHaveBeenCalledWith(type, listener);
		}
		expect(history.scrollRestoration).toBe('auto');

		// A later bootstrap gets a live router, not the torn-down one.
		expect(Injector.get(RouterService)).not.toBe(router);
		Injector.get(RouterService).destroy();
		Injector.getBinding(RouterService)?.clearInstance();

		add.mockRestore();
		remove.mockRestore();
	});

	it('runs provider teardowns once, and also when bootstrap fails', async () => {
		const teardown = vi.fn();

		const app = await bootstrap({ devMode: false, providers: [(injector) => injector.addTeardown(teardown)] });
		expect(teardown).not.toHaveBeenCalled();
		app.destroy();
		app.destroy();
		expect(teardown).toHaveBeenCalledTimes(1);

		const failed = vi.fn();
		await expect(
			bootstrap({
				devMode: false,
				providers: [(injector) => injector.addTeardown(failed)],
				rootComponent: 'not-registered-anywhere',
				target: document.body
			})
		).rejects.toThrow();
		expect(failed).toHaveBeenCalledTimes(1);
	});
});
