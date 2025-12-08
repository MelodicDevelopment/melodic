import type { Action } from './action.type';

export type Effect = (action: Action) => Promise<Action | Action[] | void>;
