import type { ActionPayload, TypedAction, ActionEffect, ReducerConfig, Action, ActionIdentifier } from '../types';
import { EffectsBase } from './effects.base.class';
import { type ReadonlySignal, type Signal, signal, computed } from '../../signals';
import { getActiveComponent } from '../../components/functions/active-component.functions';
import { getSelectorCacheKey } from '../functions/selector-cache-key.function';
import { getComponentCachedSelect } from '../functions/component-select-cache.function';

let nextInstanceId = 0;

export abstract class ComponentStateBaseService<S extends object> extends EffectsBase {
	private readonly _state: Signal<S>;
	private readonly _instanceId: number = ++nextInstanceId;

	constructor(
		private readonly _initState: S,
		private readonly _reducerConfig: ReducerConfig<S, Action> = { reducers: [] },
		private readonly _debug: boolean = false
	) {
		super();
		this._state = signal(_initState);
	}

	protected get state(): S {
		return this._state();
	}

	public resetState(): void {
		this._state.set(this._initState);
	}

	/**
	 * Returns a read-only Signal that projects this service's state through
	 * selectFn.
	 *
	 * When called inside an active component the returned signal is cached per
	 * (service-instance, cacheKey ?? selectFn-identity); distinct closures
	 * never collide, even with identical source text. The entry's lifetime
	 * depends on where the call happens:
	 *
	 * - Class-field initializer / onCreate: cached for the component's lifetime
	 *   and destroyed on disconnect.
	 * - During a render (template expression or a getter the template reads):
	 *   render-scoped — the component re-renders when the selected value
	 *   changes, and the entry is destroyed by the first render that stops
	 *   using it. Inline arrows are therefore safe: each render re-creates the
	 *   selector with its current captured values and the stale computed is
	 *   swept, so nothing accumulates.
	 *
	 * Pass `cacheKey` to unify call sites or to get cache hits across renders
	 * for parameterized selectors (e.g., `s => s.items.filter(i => i.tag === tag)`
	 * with `cacheKey: 'tag:' + tag`).
	 *
	 * Outside an active component, no caching happens; the caller owns the
	 * returned signal's lifetime.
	 */
	public select<T>(selectFn: (state: S) => T, cacheKey?: string): ReadonlySignal<T> {
		const consumer = getActiveComponent();

		if (consumer) {
			const fullKey = `cs:${this._instanceId}::${cacheKey ?? getSelectorCacheKey(selectFn)}`;
			return getComponentCachedSelect(consumer, fullKey, () => computed(() => selectFn(this._state())));
		}

		return computed(() => selectFn(this._state()));
	}

	public dispatch<T extends ActionIdentifier, P extends ActionPayload>(action: TypedAction<T, P>): void {
		if (this._debug) {
			console.log(`[ComponentState] Action: ${action.type}`);
			console.log(`[ComponentState] Payload:`, action.payload);
			console.log(`[ComponentState] Before:`, this._state());
		}

		// Find and execute reducer
		const reducer = this._reducerConfig.reducers.find((r) => r.action.type === action.type);
		if (reducer) {
			this._state.update((state) => reducer.reducer(state, action));

			if (this._debug) {
				console.log(`[ComponentState] After:`, this._state());
			}
		}

		// Execute effects
		this.executeEffects(action);
	}

	protected patchState(partial: Partial<S>): void {
		this._state.update((state) => ({ ...state, ...partial }));
	}

	private executeEffects<T extends ActionIdentifier, P extends ActionPayload>(action: TypedAction<T, P>): void {
		const actionEffects: ActionEffect[] = this.getEffects().filter((effect) => effect.actions.some((a) => a().type === action.type));

		actionEffects.forEach((effect) => {
			effect
				.effect(action)
				.then((newAction) => {
					if (newAction === undefined) {
						return;
					}

					const actions = Array.isArray(newAction) ? newAction : [newAction];
					actions.forEach((na) => this.dispatch(na as TypedAction<T, P>));
				})
				.catch((error) => {
					// A rejected effect must not become an unhandled rejection — surface
					// it with the triggering action so failures are diagnosable.
					console.error(`[ComponentState] Effect for action '${action.type}' failed:`, error);
				});
		});
	}
}
