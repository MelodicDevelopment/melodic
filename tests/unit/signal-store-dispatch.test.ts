import { describe, it, expect, vi, afterEach } from 'vitest';
import { SignalStoreService } from '../../src/state/services/signal-store.service';
import { EffectsBase } from '../../src/state/services/effects.base.class';
import { createAction, createState, createReducer, onAction } from '../../src/state/functions';
import { Injector } from '../../src/injection';
import type { ActionReducerMap } from '../../src/state/types/reducer-config.type';
import type { ActionEffectsMap } from '../../src/state/types/action-effect.type';
import type { State } from '../../src/state/types/state.type';
import type { Action } from '../../src/state/types/action.type';

type AuthState = { loggedIn: boolean };
type CartState = { items: string[] };
type AuditState = { events: string[] };

type AppState = {
	auth: AuthState;
	cart: CartState;
	audit: AuditState;
};

const logout = createAction('[App] Logout');
const recordEvent = createAction<'[Audit] Record', { name: string }>('[Audit] Record');
const explode = createAction('[App] Explode');

function makeStore(overrides: {
	state: State<AppState>;
	reducerMap: ActionReducerMap<AppState>;
	effectMap: ActionEffectsMap<AppState>;
}): SignalStoreService<AppState> {
	const store = Object.create(SignalStoreService.prototype) as SignalStoreService<AppState>;
	Object.defineProperty(store, '_state', { value: overrides.state, writable: true, configurable: true });
	Object.defineProperty(store, '_reducerMap', { value: overrides.reducerMap, writable: true, configurable: true });
	Object.defineProperty(store, '_effectMap', { value: overrides.effectMap, writable: true, configurable: true });
	Object.defineProperty(store, '_debug', { value: false, writable: true, configurable: true });
	return store;
}

function flushEffects(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('SignalStoreService dispatch', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('keyless dispatch applies the action in EVERY slice that registered it', () => {
		const state = createState<AppState>({
			auth: { loggedIn: true },
			cart: { items: ['a', 'b'] },
			audit: { events: [] }
		});

		const reducerMap: ActionReducerMap<AppState> = {
			auth: createReducer<AppState, 'auth'>(onAction(logout, () => ({ loggedIn: false }))),
			cart: createReducer<AppState, 'cart'>(onAction(logout, () => ({ items: [] })))
		};

		const store = makeStore({ state, reducerMap, effectMap: {} });

		store.dispatch(logout() as Action);

		// Before the multi-slice fix only the first matching slice updated.
		expect(state.auth().loggedIn).toBe(false);
		expect(state.cart().items).toEqual([]);
	});

	it('keyless dispatch fires effects registered in an effect-only slice (no reducers)', async () => {
		const state = createState<AppState>({
			auth: { loggedIn: true },
			cart: { items: [] },
			audit: { events: [] }
		});

		const effectRan = vi.fn(async () => undefined);

		class AuditEffects extends EffectsBase {
			constructor() {
				super();
				this.addEffect([logout], effectRan);
			}
		}
		Injector.bind(AuditEffects);

		// `audit` has NO reducers — before the fix the effect lookup iterated
		// reducer-map keys and never found this slice.
		const reducerMap: ActionReducerMap<AppState> = {
			auth: createReducer<AppState, 'auth'>(onAction(logout, () => ({ loggedIn: false })))
		};
		const effectMap: ActionEffectsMap<AppState> = { audit: AuditEffects };

		const store = makeStore({ state, reducerMap, effectMap });

		store.dispatch(logout() as Action);
		await flushEffects();

		expect(effectRan).toHaveBeenCalledOnce();
	});

	it('a rejecting effect on keyless dispatch is surfaced, does not kill the dispatch, and sibling effects still run', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const unhandled = vi.fn();
		process.on('unhandledRejection', unhandled);

		const state = createState<AppState>({
			auth: { loggedIn: true },
			cart: { items: [] },
			audit: { events: [] }
		});

		const sibling = vi.fn(async () => undefined);

		class ExplodingEffects extends EffectsBase {
			constructor() {
				super();
				this.addEffect([explode], async () => {
					throw new Error('effect blew up');
				});
			}
		}
		class SiblingEffects extends EffectsBase {
			constructor() {
				super();
				this.addEffect([explode], sibling);
			}
		}
		Injector.bind(ExplodingEffects);
		Injector.bind(SiblingEffects);

		const effectMap: ActionEffectsMap<AppState> = { auth: ExplodingEffects, audit: SiblingEffects };
		const store = makeStore({ state, reducerMap: {}, effectMap });

		expect(() => store.dispatch(explode() as Action)).not.toThrow();
		await flushEffects();
		await flushEffects();

		expect(sibling).toHaveBeenCalledOnce();
		expect(consoleError).toHaveBeenCalledWith(
			expect.stringContaining('[App] Explode'),
			expect.any(Error)
		);
		expect(unhandled).not.toHaveBeenCalled();

		process.off('unhandledRejection', unhandled);
	});

	it('effect-produced actions from a keyed dispatch update every matching slice', async () => {
		const state = createState<AppState>({
			auth: { loggedIn: true },
			cart: { items: ['a'] },
			audit: { events: [] }
		});

		class AuthEffects extends EffectsBase {
			constructor() {
				super();
				// A keyed dispatch of `logout` fans out a keyless follow-up.
				this.addEffect([logout], async () => recordEvent({ name: 'logged-out' }));
			}
		}
		Injector.bind(AuthEffects);

		const reducerMap: ActionReducerMap<AppState> = {
			auth: createReducer<AppState, 'auth'>(onAction(logout, () => ({ loggedIn: false }))),
			audit: createReducer<AppState, 'audit'>(
				onAction(recordEvent, (s, a) => ({ events: [...s.events, a.payload.name] }))
			),
			// Second slice registering the same follow-up action.
			cart: createReducer<AppState, 'cart'>(onAction(recordEvent, () => ({ items: [] })))
		};

		const store = makeStore({ state, reducerMap, effectMap: { auth: AuthEffects } });

		store.dispatch('auth', logout());
		await flushEffects();

		expect(state.auth().loggedIn).toBe(false);
		// The keyless re-dispatch reached BOTH slices, not just the first.
		expect(state.audit().events).toEqual(['logged-out']);
		expect(state.cart().items).toEqual([]);
	});

	it('a rejecting effect on keyed dispatch is caught (no unhandled rejection)', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const unhandled = vi.fn();
		process.on('unhandledRejection', unhandled);

		const state = createState<AppState>({
			auth: { loggedIn: true },
			cart: { items: [] },
			audit: { events: [] }
		});

		class KeyedExplodingEffects extends EffectsBase {
			constructor() {
				super();
				this.addEffect([explode], async () => {
					throw new Error('keyed effect blew up');
				});
			}
		}
		Injector.bind(KeyedExplodingEffects);

		const reducerMap: ActionReducerMap<AppState> = {
			auth: createReducer<AppState, 'auth'>(onAction(logout, () => ({ loggedIn: false })))
		};
		const store = makeStore({ state, reducerMap, effectMap: { auth: KeyedExplodingEffects } });

		store.dispatch('auth', explode());
		await flushEffects();
		await flushEffects();

		expect(consoleError).toHaveBeenCalled();
		expect(unhandled).not.toHaveBeenCalled();

		process.off('unhandledRejection', unhandled);
	});
});
