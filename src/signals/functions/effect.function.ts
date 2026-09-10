import { SignalEffect } from '../classes/signal-effect.class';
import { getActiveComponent } from '../../components/functions/active-component.functions';

/** Optional cleanup returned by an effect body, run before the next run and on destroy. */
export type EffectCleanup = void | (() => void);

export interface IEffectOptions {
	/** Label used in error messages and DevTools. */
	name?: string;
	/**
	 * Skip the immediate first run (default `false`). The effect then tracks
	 * nothing until something calls `run()`.
	 */
	manual?: boolean;
}

export interface IEffectRef {
	/** Re-run the effect body now. */
	run(): void;
	/** Run the pending cleanup and stop reacting to sources. */
	destroy(): void;
	readonly destroyed: boolean;
}

/**
 * Run `fn` immediately and again whenever a signal it read changes.
 *
 * ```typescript
 * const stop = effect(() => {
 *   document.title = `${unread()} unread`;
 * });
 * ```
 *
 * Returning a function from `fn` registers a cleanup, run before each re-run
 * and once on destroy:
 *
 * ```typescript
 * effect(() => {
 *   const id = setInterval(poll, interval());
 *   return () => clearInterval(id);
 * });
 * ```
 *
 * Created inside a component (a field initializer, `onInit`, `onCreate`), the
 * effect is destroyed with that component — no manual teardown needed.
 * Elsewhere the caller owns it and should call `destroy()`.
 */
export function effect(fn: () => EffectCleanup, options: IEffectOptions = {}): IEffectRef {
	let cleanup: (() => void) | null = null;
	let destroyed = false;

	const runCleanup = (): void => {
		if (!cleanup) {
			return;
		}

		const pending = cleanup;
		cleanup = null;

		try {
			pending();
		} catch (error) {
			console.error(`[Melodic] Effect${options.name ? ` '${options.name}'` : ''} cleanup failed:`, error);
		}
	};

	const signalEffect = new SignalEffect(() => {
		runCleanup();
		const result = fn();
		cleanup = typeof result === 'function' ? result : null;
	}, options.name !== undefined ? { name: options.name } : undefined);

	const ref: IEffectRef = {
		run: () => {
			if (!destroyed) {
				signalEffect.run();
			}
		},
		destroy: () => {
			if (destroyed) {
				return;
			}
			destroyed = true;
			signalEffect.destroy();
			runCleanup();
		},
		get destroyed(): boolean {
			return destroyed;
		}
	};

	// Owned by the component being constructed, if any — the same rule
	// computed(), select() and form controls follow.
	getActiveComponent()?.registerDisposable(ref);

	if (!options.manual) {
		signalEffect.run();
	}

	return ref;
}
