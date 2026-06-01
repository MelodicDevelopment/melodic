import { describe, it, expect } from 'vitest';
import { Injector } from '../../src/injection';
import { Service } from '../../src/injection/decorators/service.decorator';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';
import { ComponentStateBaseService } from '../../src/state/services/component-state-base.service';
import { setActiveComponent } from '../../src/components/functions/active-component.functions';
import type { ComponentBase } from '../../src/components/classes/component-base.class';
import type { ReducerConfig } from '../../src/state/types/reducer-config.type';
import type { Action } from '../../src/state/types/action.type';
import type { Signal } from '../../src/signals';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

type CounterState = { count: number };
const reducerConfig: ReducerConfig<CounterState, Action> = { reducers: [] };

/**
 * Mirrors the real-world pattern: a long-lived singleton service that exposes
 * selector fields built from its own state in class-field initializers.
 */
class CounterService extends ComponentStateBaseService<CounterState> {
	count = this.select((s) => s.count);

	constructor() {
		super({ count: 7 }, reducerConfig, false);
	}

	bump(): void {
		(this as unknown as { _state: Signal<CounterState> })._state.update((s) => ({
			count: (s as CounterState).count + 1
		}));
	}
}

/**
 * Regression coverage for the signal-ownership leak: a singleton service is
 * constructed lazily, often while a component is the active consumer. The
 * service's selector signals must be owned by the service (which lives forever),
 * NOT destroyed when that transient component unmounts.
 *
 * Before the fix, `Injector.get()` constructed the service with the consumer
 * component still active, so the service's `select()` signal was registered as
 * a disposable of that component and destroyed on its teardown. Re-subscribing
 * to it on a later mount then threw "Signal accessed after destruction".
 */
describe('service selector ownership across component remount', () => {
	it('does not attribute a service selector to the component that triggers DI', () => {
		Injector.bind(CounterService);

		const disposables = new Set<{ destroy(): void }>();
		const placeholder = {
			getSelectCache: () => new Map<string, Signal<unknown>>(),
			registerDisposable: (d: { destroy(): void }) => disposables.add(d)
		} as unknown as ComponentBase;

		setActiveComponent(placeholder);
		let service: CounterService;
		try {
			// Lazy construction happens here, while the component is active —
			// the exact moment the leak used to occur.
			service = Injector.get(CounterService);
		} finally {
			setActiveComponent(null);
		}

		// The service's selector belongs to the service, so the active component
		// must not have taken ownership of it.
		expect(disposables.size).toBe(0);

		// Simulate the component unmounting and destroying everything it owns.
		for (const d of disposables) {
			d.destroy();
		}

		// The service's signal must survive that teardown — subscribing again
		// (what subscribeReactiveSources does on the next mount) must not throw.
		expect(() => service.count.subscribe(() => {})).not.toThrow();
		expect(service.count()).toBe(7);
	});

	it('a component holding a service selector can mount, unmount, and remount', async () => {
		class StoreFixtureService extends ComponentStateBaseService<CounterState> {
			count = this.select((s) => s.count);

			constructor() {
				super({ count: 42 }, reducerConfig, false);
			}
		}
		Injector.bind(StoreFixtureService);

		class RemountHostComponent {
			private _store!: StoreFixtureService;
			// Held as a reactive source — collected by observe(), subscribed on
			// every connect. This is the property that threw on the second mount.
			count: Signal<number> = this._store.count;
		}
		Service(StoreFixtureService)(RemountHostComponent.prototype, '_store');
		MelodicComponent({
			selector: 'remount-host',
			template: (component: RemountHostComponent) => html`<span>count: ${component.count()}</span>`
		})(RemountHostComponent);

		// First mount.
		const first = document.createElement('remount-host');
		document.body.appendChild(first);
		await flushMicrotasks();
		expect(first.shadowRoot?.textContent).toContain('count: 42');

		// Unmount — teardown is deferred to a microtask, so let it run.
		document.body.removeChild(first);
		await flushMicrotasks();

		// Remount a fresh element. Before the fix this threw in connectedCallback
		// (the service's selector had been destroyed by the first element) and
		// left the shadow root empty.
		const second = document.createElement('remount-host');
		document.body.appendChild(second);
		await flushMicrotasks();
		expect(second.shadowRoot?.textContent).toContain('count: 42');

		document.body.removeChild(second);
	});
});
