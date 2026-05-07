import { describe, it, expect } from 'vitest';
import { ComponentStateBaseService } from '../../src/state/services/component-state-base.service';
import type { ReducerConfig } from '../../src/state/types/reducer-config.type';
import type { Action } from '../../src/state/types/action.type';
import { setActiveComponent, getActiveComponent } from '../../src/components/functions/active-component.functions';
import type { ComponentBase } from '../../src/components/classes/component-base.class';
import type { Signal } from '../../src/signals';

type CounterState = { count: number; label: string };
const reducerConfig: ReducerConfig<CounterState, Action> = { reducers: [] };

class CounterStore extends ComponentStateBaseService<CounterState> {
	constructor() {
		super({ count: 0, label: 'a' }, reducerConfig, false);
	}

	bump(): void {
		(this as unknown as { _state: Signal<CounterState> })._state.update((s) => ({
			...(s as CounterState),
			count: (s as CounterState).count + 1
		}));
	}
}

function makeFakeComponent(): ComponentBase {
	const cache = new Map<string, Signal<unknown>>();
	const disposables = new Set<{ destroy(): void }>();
	return {
		getSelectCache: () => cache,
		registerDisposable: (d: { destroy(): void }) => {
			disposables.add(d);
		},
		_disposables: disposables
	} as unknown as ComponentBase;
}

describe('ComponentStateBaseService.select() with active-component context', () => {
	it('dedups identical selectors within a component', () => {
		const store = new CounterStore();
		const c = makeFakeComponent();

		setActiveComponent(c);
		try {
			const a = store.select((s) => s.count);
			const b = store.select((s) => s.count);
			expect(a).toBe(b);
		} finally {
			setActiveComponent(null);
		}
	});

	it('different service instances do not collide in the cache', () => {
		const a = new CounterStore();
		const b = new CounterStore();
		const c = makeFakeComponent();

		setActiveComponent(c);
		try {
			const fromA = a.select((s) => s.count);
			const fromB = b.select((s) => s.count);
			expect(fromA).not.toBe(fromB);
		} finally {
			setActiveComponent(null);
		}
	});

	it('explicit cacheKey discriminates calls with the same selectFn source', () => {
		const store = new CounterStore();
		const c = makeFakeComponent();

		setActiveComponent(c);
		try {
			const tag1 = 'open';
			const tag2 = 'closed';
			const a = store.select((s) => s.label === tag1, `tag:${tag1}`);
			const b = store.select((s) => s.label === tag2, `tag:${tag2}`);
			expect(a).not.toBe(b);
		} finally {
			setActiveComponent(null);
		}
	});

	it('disposable destroys the underlying effect on cleanup', () => {
		const store = new CounterStore();
		const c = makeFakeComponent();
		const disposables = (c as unknown as { _disposables: Set<{ destroy(): void }> })._disposables;

		setActiveComponent(c);
		const sig = store.select((s) => s.count);
		setActiveComponent(null);

		let lastSeen: number | undefined;
		const unsub = sig.subscribe((v) => {
			lastSeen = v;
		});

		store.bump();
		expect(lastSeen).toBe(1);

		for (const d of disposables) {
			d.destroy();
		}

		// Reads after destroy throw (matches the cross-scope-leak fix contract).
		expect(() => sig()).toThrow(/destruction/);
		unsub();
	});

	it('falls back to a fresh computed when called outside any active component', () => {
		const store = new CounterStore();
		expect(getActiveComponent()).toBeNull();

		const a = store.select((s) => s.count);
		const b = store.select((s) => s.count);
		expect(a).not.toBe(b);
	});
});
