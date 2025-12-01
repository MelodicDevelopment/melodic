import { Signal } from './signal.class';
import { getActiveEffect, setActiveEffect } from './functions/active-effect.functions';

export class Effect {
	dependencies = new Set<Signal<any>>();

	constructor(public execute: () => void) {}

	run(): void {
		this.dependencies.forEach((signal) => {
			signal['_subscribers'].delete(this.execute);
		});

		this.dependencies.clear();

		const prevEffect = getActiveEffect();
		setActiveEffect(this);

		this.execute();

		setActiveEffect(prevEffect);
	}

	destroy(): void {
		this.dependencies.forEach((signal) => {
			signal.unsubscribe(this.execute);
		});

		this.dependencies.clear();
	}
}
