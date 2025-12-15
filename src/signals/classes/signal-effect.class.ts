import type { Signal } from '../types/signal.type';
import { getActiveEffect, setActiveEffect } from '../functions/active-effect.functions';

export class SignalEffect {
	private _dependencies = new Set<Signal<unknown>>();
	private _isRunning = false;
	private _needsRerun = false;

	readonly run: () => void;

	constructor(public execute: () => void) {
		this.run = () => {
			if (this._isRunning) {
				this._needsRerun = true;
				return;
			}

			this._isRunning = true;

			do {
				this._needsRerun = false;

				this._dependencies.forEach((signal) => {
					signal.unsubscribe(this.run);
				});

				this._dependencies.clear();

				const prevEffect = getActiveEffect();
				setActiveEffect(this);

				this.execute();

				setActiveEffect(prevEffect);
			} while (this._needsRerun);

			this._isRunning = false;
		};
	}

	addDependency<T>(signal: Signal<T>): void {
		this._dependencies.add(signal);
	}

	destroy(): void {
		this._dependencies.forEach((signal) => {
			signal.unsubscribe(this.run);
		});

		this._dependencies.clear();
	}
}
