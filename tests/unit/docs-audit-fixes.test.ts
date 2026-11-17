import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html, render } from '../../src/template';
import { signal, effect } from '../../src/signals';
import { Injector, createToken } from '../../src/injection';
import { RouterService } from '../../src/routing';
import '../../src/routing/components/router-outlet/router-outlet.component';
import { createFormControl } from '../../src/forms';
import '../../src/forms/directives/form-control.directive';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';
import type { IRoute } from '../../src/routing/interfaces/iroute.interface';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function settle(rounds: number = 6): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await tick();
	}
}

/** Source issues found while auditing the docs against the code (2026-11). */
describe('docs-audit fixes (2026-11)', () => {
	afterEach(() => {
		setDevMode(null);
		resetDevWarnings();
		vi.restoreAllMocks();
	});

	it('onPropertyChange reads are not tracked by the effect that wrote the property', async () => {
		const unrelated = signal(0);

		class Child {
			public label = 'a';
			public onPropertyChange(): void {
				unrelated();
			}
		}
		MelodicComponent({ selector: 'da-untracked-child', template: () => html`<span>x</span>` })(Child);

		const element = document.createElement('da-untracked-child') as HTMLElement & { label: string };
		document.body.appendChild(element);

		let runs = 0;
		const stop = effect(() => {
			runs++;
			element.label = `value-${runs}`;
		});
		const before = runs;

		unrelated.set(1);
		await settle(2);

		expect(runs).toBe(before);

		(stop as unknown as { destroy?: () => void }).destroy?.();
		element.remove();
	});

	describe('injector', () => {
		beforeEach(() => setDevMode(true));

		it('bindFactory warns when it replaces a resolved singleton', () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
			const token = createToken<{ id: number }>('da-rebind-factory');
			Injector.bindValue(token, { id: 1 });
			Injector.get(token);

			Injector.bindFactory(token, () => ({ id: 2 }));

			expect(warnSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('re-bound')))).toBe(true);
			Injector.unbind(token);
		});
	});

	it("updateOn: 'submit' finds a <form> that is outside the control's own template", async () => {
		const control = createFormControl<string>('', { updateOn: 'submit' });

		const form = document.createElement('form');
		const slot = document.createElement('div');
		form.appendChild(slot);
		document.body.appendChild(form);

		render(html`<input :formControl=${control} />`, slot);
		await settle(2);

		const input = slot.querySelector('input') as HTMLInputElement;
		input.value = 'typed';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(control.value()).toBe('');

		form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
		expect(control.value()).toBe('typed');

		form.remove();
	});

	it("a bare root outlet renders the '404' route given to the router", async () => {
		class NotFound {}
		MelodicComponent({ selector: 'da-not-found', template: () => html`<p>missing</p>` })(NotFound);
		class Home {}
		MelodicComponent({ selector: 'da-home', template: () => html`<p>home</p>` })(Home);

		const router = Injector.get(RouterService);
		const previous = router.getRoutes();
		const routes: IRoute[] = [
			{ path: '', component: 'da-home' },
			{ path: '404', component: 'da-not-found' }
		];
		router.setRoutes(routes);
		history.replaceState(null, '', '/');

		const outlet = document.createElement('router-outlet');
		document.body.appendChild(outlet);
		await settle();

		await router.navigate('/nowhere');
		await settle();

		expect(outlet.querySelector('da-not-found') ?? outlet.shadowRoot?.querySelector('da-not-found')).not.toBeNull();
		expect(window.location.pathname).toBe('/nowhere');

		await router.navigate('/', { skipGuards: true, skipResolvers: true });
		outlet.remove();
		router.setRoutes(previous);
		await settle(2);
	});
});
