import type { ActionPayload, TypedAction, ActionEffect, ReducerConfig, Action, ActionIdentifier } from '../types';
import { EffectsBase } from './effects.base.class';
import { type Signal, signal, computed } from '../../signals';
import { getActiveComponent } from '../../components/functions/active-component.functions';

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
	 * Returns a Signal that projects this service's state through selectFn.
	 *
	 * When called inside an active component (during template render or onCreate,
	 * or in a class-field initializer), the returned signal is cached per
	 * (service-instance, selectFn-source) for the component's lifetime and
	 * destroyed on disconnect. By default the cache key is `selectFn.toString()`.
	 *
	 * If your selector captures a variable that affects its return value
	 * (e.g., `s => s.items.filter(i => i.tag === tag)`), pass an explicit
	 * `cacheKey` to discriminate calls.
	 *
	 * Outside an active component, no caching happens; the caller owns the
	 * returned signal's lifetime.
	 */
	public select<T>(selectFn: (state: S) => T, cacheKey?: string): Signal<T> {
		const consumer = getActiveComponent();

		if (consumer) {
			const cache = consumer.getSelectCache();
			const fullKey = `cs:${this._instanceId}::${cacheKey ?? selectFn.toString()}`;
			const cached = cache.get(fullKey) as Signal<T> | undefined;
			if (cached) {
				return cached;
			}

			const sig = computed(() => selectFn(this._state()));
			cache.set(fullKey, sig as Signal<unknown>);
			consumer.registerDisposable(sig as unknown as { destroy(): void });
			return sig;
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
			effect.effect(action).then((newAction) => {
				if (newAction === undefined) {
					return;
				}

				const actions = Array.isArray(newAction) ? newAction : [newAction];
				actions.forEach((na) => this.dispatch(na as TypedAction<T, P>));
			});
		});
	}
}
