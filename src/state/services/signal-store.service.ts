import type { State } from '../types/state.type';
import type { Action, ActionIdentifier, ActionPayload, TypedAction } from '../types/action.type';
import type { ActionEffect, ActionEffects, ActionEffectsMap } from '../types/action-effect.type';
import type { ActionReducerMap } from '../types/reducer-config.type';
import { RX_INIT_STATE, RX_ACTION_PROVIDERS, RX_EFFECTS_PROVIDERS, RX_STATE_DEBUG } from '../injection.tokens';
import type { ActionReducer } from '../types/action-reducer.type';
import { Injectable, Injector, Service } from '../../injection';
import { type ReadonlySignal, type Signal, batch, computed } from '../../signals';
import { getActiveComponent } from '../../components/functions/active-component.functions';
import { getSelectorCacheKey } from '../functions/selector-cache-key.function';

type ReducerIndexEntry<S> = { key: keyof S; reducer: ActionReducer<S[keyof S], Action> };
type EffectIndexEntry<S> = { key: keyof S; effect: ActionEffect };

@Injectable()
export class SignalStoreService<S> {
	@Service(RX_INIT_STATE) private readonly _state!: State<S>;
	@Service(RX_ACTION_PROVIDERS) private readonly _reducerMap!: ActionReducerMap<S>;
	@Service(RX_EFFECTS_PROVIDERS) private readonly _effectMap!: ActionEffectsMap<S>;
	@Service(RX_STATE_DEBUG) private readonly _debug!: boolean;

	/** action.type → every slice reducer registered for it (built once, lazily). */
	private _reducerIndex?: Map<string, ReducerIndexEntry<S>[]>;
	/** action.type → every slice effect registered for it (built once, lazily). */
	private _effectIndex?: Map<string, EffectIndexEntry<S>[]>;

	constructor() {
		if (this._debug) {
			console.info('RX State Debugging: Enabled');
		}
	}

	/**
	 * Returns a read-only Signal that projects a slice of state[key] through
	 * selectFn.
	 *
	 * When called inside an active component (during template render or onCreate),
	 * the returned signal is cached for the component's lifetime and destroyed when
	 * the component unmounts. By default the cache key is the selectFn's function
	 * identity, so repeated calls with the SAME function reference return the same
	 * cached signal, and distinct closures never collide (even when their source
	 * text is identical, e.g. `s => s.items.includes(x)` with different `x`).
	 *
	 * Because identity is the key, an inline arrow recreated on every call will
	 * miss the cache each time. Hold the selector in a stable reference (class
	 * field, module constant), or pass an explicit `cacheKey` to discriminate
	 * or unify calls:
	 *
	 *     store.select('accountState',
	 *         s => s.account?.permissions?.includes(perm),
	 *         `perm:${perm}`)
	 *
	 * Outside an active component (guards, services, app boot), no caching
	 * happens; the caller owns the returned signal's lifetime.
	 */
	public select<T, K extends keyof S>(
		key: K,
		selectFn: (state: S[K]) => T,
		cacheKey?: string
	): ReadonlySignal<T> {
		const consumer = getActiveComponent();

		if (consumer) {
			const cache = consumer.getSelectCache();
			const fullKey = `${String(key)}::${cacheKey ?? getSelectorCacheKey(selectFn)}`;
			const cached = cache.get(fullKey) as ReadonlySignal<T> | undefined;
			if (cached) {
				return cached;
			}

			const sig = computed(() => selectFn(this._state[key]()));
			cache.set(fullKey, sig as unknown as Signal<unknown>);
			consumer.registerDisposable(sig as unknown as { destroy(): void });
			return sig;
		}

		return computed(() => selectFn(this._state[key]()));
	}

	public logState(): void {
		console.log(this.getCurrentState());
	}

	public dispatch<T extends ActionIdentifier, P extends ActionPayload>(action: TypedAction<T, P>): void;
	public dispatch<K extends keyof S, T extends ActionIdentifier, P extends ActionPayload>(key: K, action: TypedAction<T, P>): void;
	public dispatch<K extends keyof S, T extends ActionIdentifier, P extends ActionPayload>(x: K | TypedAction<T, P>, y?: TypedAction<T, P>): void {
		const key = typeof x === 'string' ? x : undefined;
		const action: TypedAction<T, P> = (typeof x === 'string' ? y : x) as TypedAction<T, P>;

		if (this._debug) {
			console.log(`Action: ${action.type}`);
			console.log(`Payload:`, action.payload);
			console.log(`Current State:`, this.getCurrentState());
		}

		if (key) {
			this.dispatchWithKey(key, action);
		} else {
			this.dispatchWithoutKey(action);
		}
	}

	private dispatchWithKey<K extends keyof S, T extends ActionIdentifier, P extends ActionPayload>(key: K, action: TypedAction<T, P>): void {
		if (!this._reducerMap[key]) {
			throw new Error(`Reducer not found for key: ${key as string}`);
		}

		const reducers = this._reducerMap[key].reducers;

		const reducer = reducers.find((reducer) => reducer.action.type === action.type);
		if (reducer !== undefined) {
			const newState = reducer.reducer(this._state[key](), action);
			(this._state[key] as Signal<S[K]>).set(newState);

			if (this._debug) {
				console.log(`New State:`, this.getCurrentState());
			}
		}

		const actionEffects = this.getEffectsForActionType(action.type)
			.filter((entry) => entry.key === key)
			.map((entry) => entry.effect);
		this.runEffects(actionEffects, action);
	}

	private dispatchWithoutKey<T extends ActionIdentifier, P extends ActionPayload>(action: TypedAction<T, P>): void {
		// Apply EVERY slice reducer registered for this action type (an action
		// like `logout` may be handled by several slices), batched so dependent
		// effects/computeds observe a single consistent update.
		const reducerEntries = this.getReducersForActionType(action.type);
		if (reducerEntries.length > 0) {
			batch(() => {
				for (const { key, reducer } of reducerEntries) {
					const newState = reducer.reducer(this._state[key](), action);
					(this._state[key] as Signal<S[keyof S]>).set(newState);
				}
			});

			if (this._debug) {
				console.log(`New State:`, this.getCurrentState());
			}
		}

		const actionEffects = this.getEffectsForActionType(action.type).map((entry) => entry.effect);
		this.runEffects(actionEffects, action);
	}

	/**
	 * Runs the given effects for an action. Effect-produced follow-up actions
	 * are re-dispatched; a rejected effect must not become an unhandled
	 * rejection — it is surfaced with the triggering action so failures are
	 * diagnosable, and it never prevents sibling effects from running.
	 */
	private runEffects<T extends ActionIdentifier, P extends ActionPayload>(actionEffects: ActionEffect[], action: TypedAction<T, P>): void {
		actionEffects.forEach((effect) => {
			effect
				.effect(action)
				.then((newAction) => {
					if (newAction === undefined) {
						return;
					}

					const actions = Array.isArray(newAction) ? newAction : [newAction];
					actions.forEach((na) => {
						this.dispatch(na as TypedAction<T, P>);
					});
				})
				.catch((error) => {
					console.error(`[SignalStore] Effect for action '${action.type}' failed:`, error);
				});
		});
	}

	private getReducersForActionType(actionType: string): ReducerIndexEntry<S>[] {
		if (!this._reducerIndex) {
			const index = new Map<string, ReducerIndexEntry<S>[]>();

			for (const key of Object.keys(this._reducerMap) as (keyof S)[]) {
				for (const reducer of this._reducerMap[key]?.reducers ?? []) {
					const type = reducer.action.type;
					let entries = index.get(type);
					if (!entries) {
						entries = [];
						index.set(type, entries);
					}
					entries.push({ key, reducer });
				}
			}

			this._reducerIndex = index;
		}

		return this._reducerIndex.get(actionType) ?? [];
	}

	private getEffectsForActionType(actionType: string): EffectIndexEntry<S>[] {
		if (!this._effectIndex) {
			const index = new Map<string, EffectIndexEntry<S>[]>();

			// Iterate the EFFECT map's own keys — a slice may register effects
			// without registering any reducers.
			for (const key of Object.keys(this._effectMap) as (keyof S)[]) {
				const effectClass = this._effectMap[key];
				if (!effectClass) {
					continue;
				}

				const effectService: ActionEffects = Injector.get(effectClass);
				for (const effect of effectService.getEffects()) {
					for (const actionRef of effect.actions) {
						const type = actionRef().type;
						let entries = index.get(type);
						if (!entries) {
							entries = [];
							index.set(type, entries);
						}
						if (!entries.some((entry) => entry.key === key && entry.effect === effect)) {
							entries.push({ key, effect });
						}
					}
				}
			}

			this._effectIndex = index;
		}

		return this._effectIndex.get(actionType) ?? [];
	}

	private getCurrentState(): S {
		return Object.keys(this._state).reduce((acc, key) => {
			acc[key as keyof S] = this._state[key as keyof S]();
			return acc;
		}, {} as S);
	}
}
