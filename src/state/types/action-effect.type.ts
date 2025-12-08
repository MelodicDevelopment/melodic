import type { INewable } from '../../interfaces';
import type { Action, ActionRef } from './action.type';

export type ActionEffect = {
	actions: ActionRef[];
	effect: (action: Action) => Promise<Action | Action[] | void>;
};

export type ActionEffects = {
	getEffects(): ActionEffect[];
};

export type ActionEffectsMap<S> = {
	[key in keyof S]?: INewable<ActionEffects>;
};
