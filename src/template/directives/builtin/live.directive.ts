/**
 * Live directive — bind a property against the DOM's CURRENT value.
 */

import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

/**
 * Keep a property in step with the live DOM rather than with the last value
 * this template wrote.
 *
 * Property bindings skip the write when the bound value is unchanged, which is
 * right for everything except a control the user can edit: after typing in
 * `<input .value=${text}>`, resetting `text` to the value it already had wrote
 * nothing, and the user's text stayed on screen. `live()` compares against the
 * element's current property instead:
 *
 * ```typescript
 * html`<input .value=${live(this.text)} @input=${this.onInput} />`
 * ```
 *
 * Use it for `value`, `checked`, `selected` and similar user-mutable
 * properties; a plain binding remains cheaper everywhere else.
 */
export function live<T>(value: T): IDirectiveResult {
	return directive((container: Node, previousState: unknown, name?: string) => {
		void previousState;
		const element = container as Element & Record<string, unknown>;
		const property = name ?? 'value';
		const current = element[property];

		// A `.value` property is always a string, so a numeric binding would
		// never compare equal and every render would rewrite the field (moving
		// the caret). Compare the rendered forms as well.
		if (Object.is(current, value) || (typeof current === 'string' && String(value ?? '') === current)) {
			return undefined;
		}

		element[property] = value as unknown;
		return undefined;
	}, 'live');
}
