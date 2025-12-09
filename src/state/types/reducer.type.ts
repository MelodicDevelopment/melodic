import type { Action } from './action.type';

export type Reducer<S, V extends Action = Action> = (state: S, action: V) => S;
