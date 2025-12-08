import type { Action, ActionPayload, ActionRef, TypedAction, TypedActionRef, Reducer, Effect } from '../types';
import { createAction } from '../functions';
import { type Signal, signal, computed } from '../../signals';

export abstract class ComponentStateBaseAltService<S extends object> {
	private _state: Signal<S> = signal({} as S);
	private _actionReducerMap: {
		[key: string]: {
			action: Action;
			reducer: Reducer<S>;
		};
	} = {};
	private _effectsMap: {
		actions: ActionRef[];
		effect: Effect;
	}[] = [];

	constructor(private _initState: S) {
		this.resetState();
	}

	resetState(): void {
		this._state.set(this._initState);
	}

	getState(): S {
		return this._state();
	}

	select<K extends keyof S, T>(key: K): Signal<T> {
		return computed(() => this._state()[key] as T);
	}

	addAction<T extends string, P extends ActionPayload>(action: T): TypedActionRef<T, P> {
		const actionType: T = action as T;

		const typedAction = {
			type: actionType,
			payload: {} as P
		} as TypedAction<T, P>;

		this._actionReducerMap[actionType] = {
			action: typedAction,
			reducer: (state: S): S => state
		};

		return createAction<T, P>(actionType);
	}

	onAction<T extends string, P extends ActionPayload>(action: TypedActionRef<T, P>, reducerFn: (state: S, payload: P) => S): void {
		const actionType: T = action().type as T;

		if (this._actionReducerMap[actionType]) {
			this._actionReducerMap[actionType].reducer = reducerFn as Reducer<S>;
		} else {
			console.error(`Action does not exist: ${actionType}`);
		}
	}

	addEffect(actions: ActionRef | ActionRef[], effect: Effect): void {
		if (!Array.isArray(actions)) {
			actions = [actions];
		}

		this._effectsMap.push({ actions, effect });
	}

	dispatch<T extends string, P extends ActionPayload>(action: TypedAction<T, P>): void {
		console.log('Action', action);
		console.log('Get Action', this._actionReducerMap[action.type]);

		console.log('Before State', this._state());

		if (this._actionReducerMap[action.type]) {
			const reducer = this._actionReducerMap[action.type].reducer;
			this._state.update((state) => reducer(state, action.payload));
		} else {
			console.error(`Action does not exist: ${action.type}`);
		}

		console.log('After State', this._state());

		// search for effects
		const actionEffects = this._effectsMap.filter((effect) => effect.actions.some((a) => a().type === action.type));
		if (actionEffects.length > 0) {
			actionEffects.forEach((actionEffect) => {
				const actionMatch = actionEffect.actions.find((a) => a().type === action.type);
				if (actionMatch) {
					actionEffect.effect(actionMatch(action.payload)).then((result) => {
						if (!result) {
							return;
						}

						if (Array.isArray(result)) {
							result.forEach((r) => this.dispatch(r as TypedAction<T, P>));
						} else {
							this.dispatch(result as TypedAction<T, P>);
						}
					});
				}
			});
		}
	}
}
