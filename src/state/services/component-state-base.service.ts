import { computed, Signal, WritableSignal } from '@angular/core';
import { Action, ActionPayload, TypedAction } from '../types/action.type';
import { ActionEffect, ActionReducer, ActionReducerMap, State } from '../types';
import { EffectsBase } from './effects.base.class';
import { createState } from '../functions';

export abstract class ComponentStateBaseService<S extends object> extends EffectsBase {
	private _state: State<S>;

	constructor(
		private _initState: S,
		private _reducerMap: ActionReducerMap<S> = {}
	) {
		super();

		this._state = createState<S>(_initState);
	}

	resetState(): void {
		this._state = createState<S>(this._initState);
	}

	select<T, K extends keyof S>(key: K, selectFn: (state: S[K]) => T): Signal<T> {
		return computed(() => {
			return selectFn(this._state[key]());
		});
	}

	dispatch<T extends string, P extends ActionPayload>(action: TypedAction<T, P>): void;
	dispatch<K extends keyof S, T extends string, P extends ActionPayload>(key: K, action: TypedAction<T, P>): void;
	dispatch<K extends keyof S, T extends string, P extends ActionPayload>(x: K | TypedAction<T, P>, y?: TypedAction<T, P>): void {
		const key = typeof x === 'string' ? x : undefined;
		const action: TypedAction<T, P> = (typeof x === 'string' ? y : x) as TypedAction<T, P>;

		console.log(`Action: ${action.type}`);
		console.log(`Payload:`, action.payload);
		console.log(`Current State:`, this.getCurrentState());

		if (key) {
			this.dispatchWithKey(key, action);
		} else {
			this.dispatchWithoutKey(action);
		}
	}

	private dispatchWithKey<K extends keyof S, T extends string, P extends ActionPayload>(key: K, action: TypedAction<T, P>): void {
		if (!this._reducerMap[key]) {
			throw new Error(`Reducer not found for key: ${key as string}`);
		}

		const reducers = this._reducerMap[key].reducers;

		const reducer = reducers.find((reducer) => reducer.action.type === action.type);
		if (reducer !== undefined) {
			const newState = reducer.reducer(this._state[key](), action);
			(this._state[key]() as WritableSignal<S[K]>).set(newState);

			console.log(`New State:`, this.getCurrentState());
		}

		const actionEffects: ActionEffect[] = this.getEffectsForAction(action);
		actionEffects.forEach((effect) => {
			effect.effect(action).then((newAction) => {
				if (newAction === undefined) {
					return;
				}

				if (!Array.isArray(newAction)) {
					newAction = [newAction];
				}

				newAction.forEach((na) => {
					this.dispatch(na as TypedAction<T, P>);
				});
			});
		});
	}

	private dispatchWithoutKey<T extends string, P extends ActionPayload>(action: TypedAction<T, P>): void {
		const reducerWithKey = this.getReducerForAction(action);
		if (reducerWithKey !== undefined) {
			const newState = reducerWithKey.actionReducer.reducer(this._state[reducerWithKey.key](), action);
			(this._state[reducerWithKey.key] as WritableSignal<S[keyof S]>).set(newState);

			console.log(`New State:`, this.getCurrentState());
		}

		const actionEffects: ActionEffect[] = this.getEffectsForAction(action);
		actionEffects.forEach((effect) => {
			effect.effect(action).then((newAction) => {
				if (newAction === undefined) {
					return;
				}

				if (!Array.isArray(newAction)) {
					newAction = [newAction];
				}

				newAction.forEach((na) => {
					this.dispatch(na as TypedAction<T, P>);
				});
			});
		});
	}

	private getReducerForAction<T extends string, P extends ActionPayload>(
		action: TypedAction<T, P>
	): { key: keyof S; actionReducer: ActionReducer<S[keyof S], Action> } | undefined {
		const keys: (keyof S)[] = Object.keys(this._reducerMap) as (keyof S)[];

		for (const key of keys) {
			const reducers = this._reducerMap[key]?.reducers || [];
			const reducer = reducers.find((reducer) => reducer.action.type === action.type);

			if (reducer) {
				return { key, actionReducer: reducer };
			}
		}

		return undefined;
	}

	private getEffectsForAction<T extends string, P extends ActionPayload>(action: TypedAction<T, P>): ActionEffect[] {
		const effects = this.getEffects().filter((effect) => effect.actions.some((a) => a().type === action.type));
		return effects;
	}

	private getCurrentState(): S {
		return Object.keys(this._state).reduce((acc, key) => {
			acc[key as keyof S] = this._state[key as keyof S]();
			return acc;
		}, {} as S);
	}
}
