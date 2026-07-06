import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import type { ComponentBase } from '../../src/components/classes/component-base.class';
import { ComponentStateBaseService } from '../../src/state/services/component-state-base.service';
import { html } from '../../src/template';
import type { ReducerConfig } from '../../src/state/types/reducer-config.type';
import type { Action } from '../../src/state/types/action.type';
import type { Signal } from '../../src/signals';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

type CounterState = { count: number };
const reducerConfig: ReducerConfig<CounterState, Action> = { reducers: [] };

class CounterFixtureService extends ComponentStateBaseService<CounterState> {
	constructor() {
		super({ count: 0 }, reducerConfig, false);
	}

	bump(): void {
		(this as unknown as { _state: Signal<CounterState> })._state.update((s) => ({
			count: (s as CounterState).count + 1
		}));
	}
}

function cacheSize(el: Element): number {
	return (el as ComponentBase).getSelectCache().size;
}

function disposableCount(el: Element): number {
	return (el as unknown as { _disposables: Set<unknown> })._disposables.size;
}

/**
 * Regression coverage for the inline-selector leak: a selector recreated every
 * render (inline arrow / getter pattern) used to register a NEW live computed
 * per render for the component's lifetime, growing the select cache and the
 * per-dispatch work without bound. Render-created entries are now render-scoped:
 * they re-render the component on change and are swept when a render stops
 * using them.
 */
describe('render-scoped select() entries', () => {
	it('an inline selector does not accumulate cache entries or disposables across renders', async () => {
		const service = new CounterFixtureService();

		class InlineSelectHost {
			get count(): number {
				return service.select((s) => s.count)();
			}
		}
		MelodicComponent({
			selector: 'inline-select-host',
			template: (c: InlineSelectHost) => html`<span>count: ${c.count}</span>`
		})(InlineSelectHost);

		const el = document.createElement('inline-select-host');
		document.body.appendChild(el);
		await flushMicrotasks();
		expect(el.shadowRoot?.textContent).toContain('count: 0');

		const cacheAfterFirstRender = cacheSize(el);
		const disposablesAfterFirstRender = disposableCount(el);

		for (let i = 0; i < 5; i++) {
			service.bump();
			await flushMicrotasks();
		}

		expect(el.shadowRoot?.textContent).toContain('count: 5');
		// Exactly one live entry per call site — the stale per-render computeds were swept.
		expect(cacheSize(el)).toBe(cacheAfterFirstRender);
		expect(disposableCount(el)).toBe(disposablesAfterFirstRender);

		document.body.removeChild(el);
		await flushMicrotasks();
	});

	it('a select() read during render re-renders the component when the value changes', async () => {
		const service = new CounterFixtureService();

		class GetterReactivityHost {
			get count(): number {
				return service.select((s) => s.count)();
			}
		}
		MelodicComponent({
			selector: 'getter-reactivity-host',
			template: (c: GetterReactivityHost) => html`<span>count: ${c.count}</span>`
		})(GetterReactivityHost);

		const el = document.createElement('getter-reactivity-host');
		document.body.appendChild(el);
		await flushMicrotasks();
		expect(el.shadowRoot?.textContent).toContain('count: 0');

		// No field holds this signal — the render-scoped subscription alone
		// must drive the re-render.
		service.bump();
		await flushMicrotasks();
		expect(el.shadowRoot?.textContent).toContain('count: 1');

		document.body.removeChild(el);
		await flushMicrotasks();
	});

	it('field-initializer selectors are component-lifetime and survive renders that do not call select()', async () => {
		const service = new CounterFixtureService();

		class FieldSelectHost {
			count = service.select((s) => s.count);
		}
		MelodicComponent({
			selector: 'field-select-host',
			template: (c: FieldSelectHost) => html`<span>count: ${c.count()}</span>`
		})(FieldSelectHost);

		const el = document.createElement('field-select-host');
		document.body.appendChild(el);
		await flushMicrotasks();
		expect(el.shadowRoot?.textContent).toContain('count: 0');
		expect(cacheSize(el)).toBe(1);

		// Renders happen (via the reactive-source subscription) without select()
		// being called again — the construction-time entry must NOT be swept.
		for (let i = 0; i < 3; i++) {
			service.bump();
			await flushMicrotasks();
		}
		expect(el.shadowRoot?.textContent).toContain('count: 3');
		expect(cacheSize(el)).toBe(1);
		expect(() => (el as unknown as { component: FieldSelectHost }).component.count()).not.toThrow();

		document.body.removeChild(el);
		await flushMicrotasks();
	});
});
