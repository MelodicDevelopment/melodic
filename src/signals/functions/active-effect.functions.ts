import type { Effect } from '../effect.class';

let activeEffect: Effect | null = null;

export const setActiveEffect = (effect: Effect | null): void => {
	activeEffect = effect;
};

export const getActiveEffect = (): Effect | null => activeEffect;
