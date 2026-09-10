import { DEPENDENTS, type IDependent, type IProducer } from '../types/signal.type';
import { getActiveEffect, setActiveEffect } from '../functions/active-effect.functions';
import { isCoalescingEffects, scheduleEffect, unscheduleEffect } from '../functions/batch.function';
import { emitDevtools } from '../../devtools/hook';

/**
 * Maximum number of synchronous re-runs allowed in a single direct run cycle.
 * Exceeding this indicates an effect that writes a signal it also depends on,
 * forming a self-perpetuating loop. We throw instead of hanging the tab.
 * (Runs driven by the scheduler are bounded separately, per flush.)
 */
const MAX_EFFECT_ITERATIONS = 100;

export interface ISignalEffectOptions {
	/**
	 * Called instead of scheduling a run when a tracked source changes. Used by
	 * `computed()` to propagate invalidation lazily without executing.
	 */
	onInvalidate?: () => void;

	/** Label used in error messages and DevTools. */
	name?: string;
}

export class SignalEffect implements IDependent {
	private _dependencies = new Set<IProducer>();
	private _isRunning = false;
	private _needsRerun = false;
	private _destroyed = false;
	private _hasRun = false;
	private readonly _onInvalidate: (() => void) | undefined;

	/** Label used in error messages and DevTools. */
	public readonly name: string | undefined;

	public readonly run: () => void;

	constructor(
		public execute: () => void,
		options?: ISignalEffectOptions
	) {
		this._onInvalidate = options?.onInvalidate;
		this.name = options?.name;

		this.run = () => {
			if (this._destroyed) {
				return;
			}

			// The FIRST run always executes synchronously, even inside a batch
			// or a flush: `run()` is how an effect establishes its tracking, and
			// deferring it meant code immediately after `effect.run()` observed
			// an effect that had not run yet — which made a predictable
			// `effect()` helper impossible to build.
			if (this._hasRun && isCoalescingEffects()) {
				// During a batch (or its flush) coalesce: schedule a single run so an
				// effect depending on several batched signals executes once.
				scheduleEffect(this);
				return;
			}

			this.runNow();
		};
	}

	/** True once the effect has executed at least once. */
	public get hasRun(): boolean {
		return this._hasRun;
	}

	public get destroyed(): boolean {
		return this._destroyed;
	}

	/**
	 * A tracked source changed. Queues a run (or, for computeds, propagates
	 * the invalidation) — never executes user code synchronously.
	 */
	public invalidate(): void {
		if (this._destroyed) {
			return;
		}

		if (this._onInvalidate) {
			this._onInvalidate();
			return;
		}

		scheduleEffect(this);
	}

	/** Execute the effect immediately, bypassing batch coalescing. */
	public runNow(): void {
		if (this._destroyed) {
			return;
		}

		if (this._isRunning) {
			this._needsRerun = true;
			return;
		}

		this._isRunning = true;
		this._hasRun = true;
		let iterations = 0;

		try {
			do {
				if (++iterations > MAX_EFFECT_ITERATIONS) {
					// Reset re-run state; _isRunning is restored by the finally below.
					this._needsRerun = false;
					throw new Error(
						`Circular dependency detected in effect${this.name ? ` '${this.name}'` : ''}: exceeded ${MAX_EFFECT_ITERATIONS} synchronous re-runs. ` +
							'An effect is repeatedly writing to a signal it also reads.'
					);
				}

				this._needsRerun = false;
				this.clearDependencies();

				const prevEffect = getActiveEffect();
				setActiveEffect(this);

				try {
					emitDevtools('effect:run', () => ({ name: this.name }));
					this.execute();
				} finally {
					// A throwing execute() must never leave the global active-effect
					// pointing at this (possibly dead) effect.
					setActiveEffect(prevEffect);
				}
			} while (this._needsRerun && !this._destroyed);
		} finally {
			this._isRunning = false;
		}
	}

	/** Record `producer` as a source of this effect (called by the producer on a tracked read). */
	public addDependency(producer: IProducer): void {
		this._dependencies.add(producer);
	}

	/** Detach from every tracked source without destroying the effect (re-tracking follows). */
	public clearDependencies(): void {
		this._dependencies.forEach((producer) => {
			producer[DEPENDENTS].delete(this);
		});

		this._dependencies.clear();
	}

	/** Detach from all sources, cancel any queued run and refuse future runs. */
	public destroy(): void {
		this._destroyed = true;
		this._needsRerun = false;
		this.clearDependencies();
		unscheduleEffect(this);
	}
}
