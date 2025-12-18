import type { Action } from './action.type';
import type { Effect } from './effect.type';

export type ActionEffect = {
	actions: Action[];
	effect: Effect;
};
