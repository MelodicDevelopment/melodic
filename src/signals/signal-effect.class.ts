import type { Signal } from './types/signal.type';
import { getActiveEffect, setActiveEffect } from './functions/active-effect.functions';

export class SignalEffect {
	private _dependencies = new Set<Signal<unknown>>();

	constructor(public execute: () => void) {}

	addDependency<T>(signal: Signal<T>): void {
		this._dependencies.add(signal);
	}

	run(): void {
		this._dependencies.forEach((signal) => {
			signal.unsubscribe(this.execute);
		});

		this._dependencies.clear();

		const prevEffect = getActiveEffect();
		setActiveEffect(this);

		this.execute();

		setActiveEffect(prevEffect);
	}

	destroy(): void {
		this._dependencies.forEach((signal) => {
			signal.unsubscribe(this.execute);
		});

		this._dependencies.clear();
	}
}
