import type { Action } from './action.type';

export type ActionReducer<S, V extends Action> = {
	action: V;
	reducer: (state: S, action: V) => S;
};
