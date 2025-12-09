import type { ActionReducer, Action, ReducerConfig } from '../types';

// Overload for flat state (component state)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createReducer<S>(...actionReducers: ActionReducer<S, any>[]): ReducerConfig<S, Action>;

// Overload for sliced state (global state)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createReducer<S, K extends keyof S>(...actionReducers: ActionReducer<S[K], any>[]): ReducerConfig<S[K], Action>;

// Implementation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createReducer<S, K extends keyof S = never>(...actionReducers: ActionReducer<S | S[K], any>[]): ReducerConfig<S | S[K], Action> {
	return { reducers: actionReducers as ActionReducer<S | S[K], Action>[] };
}
