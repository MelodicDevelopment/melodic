import type { ActionPayload, TypedAction, ActionEffect, ActionReducer } from '../types';
import { EffectsBase } from './effects.base.class';
import { type Signal, signal, computed } from '../../signals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActionReducer<S> = ActionReducer<S, any>;

export abstract class ComponentStateBaseService<S extends object> extends EffectsBase {
	private _state: Signal<S>;
	private _debug = false;

	constructor(private _initState: S, private _reducers: AnyActionReducer<S>[] = [], debug: boolean = false) {
		super();
		this._state = signal(_initState);
		this._debug = debug;
	}

	protected get state(): S {
		return this._state();
	}

	resetState(): void {
		this._state.set(this._initState);
	}

	select<T>(selectFn: (state: S) => T): Signal<T> {
		return computed(() => selectFn(this._state()));
	}

	dispatch<T extends string, P extends ActionPayload>(action: TypedAction<T, P>): void {
		if (this._debug) {
			console.log(`[ComponentState] Action: ${action.type}`);
			console.log(`[ComponentState] Payload:`, action.payload);
			console.log(`[ComponentState] Before:`, this._state());
		}

		// Find and execute reducer
		const reducer = this._reducers.find((r) => r.action.type === action.type);
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

	private executeEffects<T extends string, P extends ActionPayload>(action: TypedAction<T, P>): void {
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
