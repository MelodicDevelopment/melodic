import { Signal } from './signal.class';

export class Effect {
	dependencies = new Set<Signal<any>>();

	constructor(public execute: () => void) {}

	run(): void {
		this.dependencies.forEach((signal) => {
			signal['_subscribers'].delete(this.execute);
		});

		this.dependencies.clear();

		const prevEffect = Signal.ActiveEffect;
		Signal.ActiveEffect = this;

		this.execute();

		Signal.ActiveEffect = prevEffect;
	}

	destroy(): void {
		this.dependencies.forEach((signal) => {
			signal['_subscribers'].delete(this.execute);
		});

		this.dependencies.clear();
	}
}
