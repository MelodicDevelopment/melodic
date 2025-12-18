import type { Action, TypedAction } from '../types/action.type';
import { computed, signal, type Signal } from '../../signals';
import type { Reducer } from '../types/reducer.type';
import type { ActionPayload, EmptyActionPayload } from '../types/action-payload.type';
import type { ActionEffect } from '../types/action-effect.type';

export abstract class Store<S extends object> {
	private _state: Signal<S>;

	private _actionReducers: {
		[key: string]: Reducer<S>;
	} = {};

	private _actionEffects: ActionEffect[] = [];

	public resetState = this.addAction<'RESET_STATE'>('RESET_STATE', () => ({ ...this._initialState }));

	constructor(private _initialState: S) {
		this._state = signal(_initialState);
	}

	public select<T>(selectFn: (state: S) => T): Signal<T> {
		return computed(() => selectFn(this._state()));
	}

	public dispatch<T extends string, P extends ActionPayload = EmptyActionPayload>(action: TypedAction<T, P>, payload?: P): void {
		const reducer = this._actionReducers[action.type];

		if (reducer) {
			this._state.update((state) => reducer(state, payload));
		}

		this.executeEffects(action);
	}

	protected patchState(partial: Partial<S>): void {
		this._state.update((state) => ({ ...state, ...partial }));
	}

	protected addAction<T extends string, P extends ActionPayload = EmptyActionPayload>(type: T, reducer: (state: S, payload?: P) => S): TypedAction<T, P> {
		this._actionReducers[type] = reducer as (state: S, payload?: unknown) => S;

		const actionRef: TypedAction<T, P> = {
			type: type,
			payload: {} as P
		};

		return actionRef;
	}

	protected addEffect<T extends string, P extends ActionPayload = EmptyActionPayload>(
		actions: TypedAction<T, P>[],
		effect: (action: TypedAction<T, P>) => Promise<Action | Action[] | void>
	): void {
		this._actionEffects.push({
			actions: actions,
			effect: effect as (action: Action) => Promise<Action | Action[] | void>
		});
	}

	private executeEffects<T extends string, P extends ActionPayload>(action: TypedAction<T, P>): void {
		const actionEffects: ActionEffect[] = this._actionEffects.filter((effect) => effect.actions.some((a) => a.type === action.type));

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
