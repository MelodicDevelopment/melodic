import type { Signal } from '../types/signal.type';
import { getActiveEffect, setActiveEffect } from '../functions/active-effect.functions';
import { isCoalescingEffects, scheduleEffect } from '../functions/batch.function';

/**
 * Maximum number of synchronous re-runs allowed in a single run cycle.
 * Exceeding this indicates an effect that writes a signal it also depends on,
 * forming a self-perpetuating loop. We throw instead of hanging the tab.
 */
const MAX_EFFECT_ITERATIONS = 100;

export class SignalEffect {
	private _dependencies = new Set<Signal<unknown>>();
	private _isRunning = false;
	private _needsRerun = false;

	public readonly run: () => void;

	constructor(public execute: () => void) {
		this.run = () => {
			// During a batch (or its flush) coalesce: schedule a single run so an
			// effect depending on several batched signals executes once.
			if (isCoalescingEffects()) {
				scheduleEffect(this);
				return;
			}

			this.runNow();
		};
	}

	/** Execute the effect immediately, bypassing batch coalescing. */
	public runNow(): void {
		if (this._isRunning) {
			this._needsRerun = true;
			return;
		}

		this._isRunning = true;
		let iterations = 0;

		do {
			if (++iterations > MAX_EFFECT_ITERATIONS) {
				// Reset state so the effect isn't left permanently "running".
				this._isRunning = false;
				this._needsRerun = false;
				throw new Error(
					`Circular dependency detected in effect: exceeded ${MAX_EFFECT_ITERATIONS} synchronous re-runs. ` +
						'An effect is repeatedly writing to a signal it also reads.'
				);
			}

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
	}

	public addDependency<T>(signal: Signal<T>): void {
		this._dependencies.add(signal);
	}

	public destroy(): void {
		this._dependencies.forEach((signal) => {
			signal.unsubscribe(this.run);
		});

		this._dependencies.clear();
	}
}
