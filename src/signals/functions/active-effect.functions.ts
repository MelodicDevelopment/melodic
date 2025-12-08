import type { SignalEffect } from '../signal-effect.class';

let activeEffect: SignalEffect | null = null;

export const setActiveEffect = (effect: SignalEffect | null): void => {
	activeEffect = effect;
};

export const getActiveEffect = (): SignalEffect | null => activeEffect;
