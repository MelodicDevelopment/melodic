export interface IEmitOptions {
	/** Cross the shadow boundary (default `true`). */
	composed?: boolean;
	/** Bubble up the tree (default `true`). */
	bubbles?: boolean;
	/** Allow `preventDefault()` (default `false`). */
	cancelable?: boolean;
}

/**
 * Dispatch a custom event from a component.
 *
 * ```typescript
 * emit(this.elementRef, 'ml:change', { value });
 * ```
 *
 * The defaults are the ones a component almost always wants and that are easy
 * to get wrong by hand: `composed: true` (otherwise the event stops at the
 * shadow boundary and the consumer never sees it) and `bubbles: true`. Returns
 * `false` when a listener called `preventDefault()` on a cancelable event.
 */
export function emit<T = unknown>(host: EventTarget, name: string, detail?: T, options: IEmitOptions = {}): boolean {
	return host.dispatchEvent(
		new CustomEvent<T>(name, {
			detail: detail as T,
			bubbles: options.bubbles ?? true,
			composed: options.composed ?? true,
			cancelable: options.cancelable ?? false
		})
	);
}
