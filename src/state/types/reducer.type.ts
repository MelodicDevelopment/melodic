import type { ActionPayload } from './action.type';

export type Reducer<S> = <P extends ActionPayload>(state: S, payload?: P) => S;
