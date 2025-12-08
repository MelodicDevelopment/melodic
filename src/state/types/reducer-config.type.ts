import type { ActionReducer } from './action-reducer.type';
import type { Action } from './action.type';

export type ReducerConfig<S, V extends Action> = {
	reducers: ActionReducer<S, V>[];
};

export type ActionReducerMap<S> = {
	[key in keyof S]?: ReducerConfig<S[key], Action>;
};
