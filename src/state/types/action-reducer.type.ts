import type { Action } from './action.type';
import type { Reducer } from './reducer.type';

export type ActionReducer<S, V extends Action> = {
	action: V;
	reducer: Reducer<S, V>;
};
