import type { INewable } from '../../interfaces';
import type { ActionRef } from './action.type';
import type { Effect } from './effect.type';

export type ActionEffect = {
	actions: ActionRef[];
	effect: Effect;
};

export type ActionEffects = {
	getEffects(): ActionEffect[];
};

export type ActionEffectsMap<S> = {
	[key in keyof S]?: INewable<ActionEffects>;
};
