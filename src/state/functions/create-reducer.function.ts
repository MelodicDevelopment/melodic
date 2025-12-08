import type { ActionReducer, Action, ReducerConfig } from '../types';

export const createReducer = <S, K extends keyof S>(...actionReducers: ActionReducer<S[K], any>[]): ReducerConfig<S[K], Action> => {
	return { reducers: actionReducers as ActionReducer<S[K], Action>[] };
};
