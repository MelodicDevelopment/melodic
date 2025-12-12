import type { Signal } from './types/signal.type';
import { getActiveEffect, setActiveEffect } from './functions/active-effect.functions';

export class SignalEffect {
	private _dependencies = new Set<Signal<unknown>>();
	private _isRunning = false;
	private _needsRerun = false;

	// Stable bound reference for subscribe/unsubscribe
	readonly run: () => void;

	constructor(public execute: () => void) {
		// Bind once so the same reference is used for subscribe/unsubscribe
		this.run = () => {
			// Prevent re-entrancy - if we're already running, schedule a rerun
			if (this._isRunning) {
				this._needsRerun = true;
				return;
			}

			this._isRunning = true;

			do {
				this._needsRerun = false;

				// Clear old subscriptions before re-running
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
