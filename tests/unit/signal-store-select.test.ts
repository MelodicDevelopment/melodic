import { describe, it, expect } from 'vitest';
import { SignalStoreService } from '../../src/state/services/signal-store.service';
import { signal } from '../../src/signals';
import type { Signal } from '../../src/signals';
import { setActiveComponent, getActiveComponent } from '../../src/components/functions/active-component.functions';
import type { ComponentBase } from '../../src/components/classes/component-base.class';

type AppState = {
	account: { id: number; permissions: string[] };
	flags: { darkMode: boolean };
};

function makeStore(): SignalStoreService<AppState> {
	const store = Object.create(SignalStoreService.prototype) as SignalStoreService<AppState>;
	const state = {
		account: signal({ id: 1, permissions: ['read', 'write'] }),
		flags: signal({ darkMode: false })
	};
	Object.defineProperty(store, '_state', { value: state, writable: true, configurable: true });
	Object.defineProperty(store, '_reducerMap', { value: {}, writable: true, configurable: true });
	Object.defineProperty(store, '_effectMap', { value: {}, writable: true, configurable: true });
	Object.defineProperty(store, '_debug', { value: false, writable: true, configurable: true });
	return store;
}

function makeFakeComponent(): ComponentBase {
	const cache = new Map<string, Signal<unknown>>();
	const disposables = new Set<{ destroy(): void }>();
	return {
		getSelectCache: () => cache,
		registerDisposable: (d: { destroy(): void }) => {
			disposables.add(d);
		},
		// expose for tests to introspect
		_disposables: disposables
	} as unknown as ComponentBase;
}

describe('SignalStoreService.select() with active-component context', () => {
	it('dedups within a component for repeated calls with the same selector reference', () => {
		const store = makeStore();
		const component = makeFakeComponent();

		const selectId = (s: AppState['account']): number => s.id;

		setActiveComponent(component);
		try {
			const a = store.select('account', selectId);
			const b = store.select('account', selectId);
			expect(a).toBe(b);
			expect(component.getSelectCache().size).toBe(1);
		} finally {
			setActiveComponent(null);
		}
	});

	it('returns different signals for different selectors on the same key', () => {
		const store = makeStore();
		const component = makeFakeComponent();

		setActiveComponent(component);
		try {
			const id = store.select('account', (s) => s.id);
			const perms = store.select('account', (s) => s.permissions);
			expect(id).not.toBe(perms);
			expect(component.getSelectCache().size).toBe(2);
		} finally {
			setActiveComponent(null);
		}
	});

	it('explicit cacheKey discriminates calls with the same selectFn source', () => {
		const store = makeStore();
		const component = makeFakeComponent();

		setActiveComponent(component);
		try {
			const perm1 = 'read';
			const perm2 = 'write';
			const a = store.select('account', (s) => s.permissions.includes(perm1), `perm:${perm1}`);
			const b = store.select('account', (s) => s.permissions.includes(perm2), `perm:${perm2}`);
			const c = store.select('account', (s) => s.permissions.includes(perm1), `perm:${perm1}`);
			expect(a).not.toBe(b);
			expect(a).toBe(c);
		} finally {
			setActiveComponent(null);
		}
	});

	it('cacheKey overrides toString — caller intent wins', () => {
		const store = makeStore();
		const component = makeFakeComponent();

		setActiveComponent(component);
		try {
			const a = store.select('account', (s) => s.id, 'shared');
			// Different selectFn source, but same explicit cacheKey: cache hit.
			const b = store.select('account', (s) => s.permissions.length, 'shared');
			expect(a).toBe(b);
		} finally {
			setActiveComponent(null);
		}
	});

	it('cleanup on disconnect destroys the underlying effect (no longer subscribes to upstream)', () => {
		const store = makeStore();
		const component = makeFakeComponent();
		const disposables = (component as unknown as { _disposables: Set<{ destroy(): void }> })._disposables;

		setActiveComponent(component);
		const sig = store.select('account', (s) => s.id);
		setActiveComponent(null);

		let received: number | undefined;
		const unsub = sig.subscribe((v) => {
			received = v;
		});

		const stateSignal = (store as unknown as { _state: { account: Signal<{ id: number; permissions: string[] }> } })._state.account;
		stateSignal.set({ id: 2, permissions: [] });
		expect(received).toBe(2);

		// Simulate disconnect: destroy all registered disposables.
		for (const d of disposables) {
			d.destroy();
		}

		// After destroy, upstream changes no longer reach the computed.
		stateSignal.set({ id: 3, permissions: [] });
		expect(received).toBe(2);

		unsub();
	});

	it('falls back to fresh computed when called outside any active component', () => {
		const store = makeStore();
		expect(getActiveComponent()).toBeNull();

		const a = store.select('account', (s) => s.id);
		const b = store.select('account', (s) => s.id);
		expect(a).not.toBe(b);
	});

	// Regression for the toString-keyed cache: two closures with identical source
	// text but different captured variables used to collide and return the wrong
	// cached signal. Identity keying (WeakMap) discriminates them.
	it('closure-capturing selectors no longer collide when cacheKey is omitted', () => {
		const store = makeStore();
		const component = makeFakeComponent();

		setActiveComponent(component);
		try {
			const make = (perm: string) => store.select('account', (s) => s.permissions.includes(perm));
			const a = make('read');
			const b = make('admin');
			expect(a).not.toBe(b);
			expect(a()).toBe(true);
			expect(b()).toBe(false);
		} finally {
			setActiveComponent(null);
		}
	});

	it('FIX FOR CAVEAT: passing an explicit cacheKey discriminates capturing selectors', () => {
		const store = makeStore();
		const component = makeFakeComponent();

		setActiveComponent(component);
		try {
			const make = (perm: string) => store.select('account', (s) => s.permissions.includes(perm), `perm:${perm}`);
			const a = make('read');
			const b = make('write');
			expect(a).not.toBe(b);
			expect(a()).toBe(true);
			expect(b()).toBe(true);
		} finally {
			setActiveComponent(null);
		}
	});
});
