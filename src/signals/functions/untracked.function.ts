import { getActiveEffect, setActiveEffect } from './active-effect.functions';

/**
 * Read signals without subscribing the surrounding effect, computed or
 * component render to them.
 *
 * ```typescript
 * effect(() => {
 *   // re-runs when `query` changes, but not when `page` does
 *   search(query(), untracked(() => page()));
 * });
 * ```
 */
export function untracked<T>(fn: () => T): T {
	const previous = getActiveEffect();
	setActiveEffect(null);

	try {
		return fn();
	} finally {
		setActiveEffect(previous);
	}
}
