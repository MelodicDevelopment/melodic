import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

/**
 * Helper function to create a simple directive without a class.
 *
 * Example:
 * ```typescript
 * const myDirective = directive((container, previousState) => {
 *   container.textContent = 'Hello!';
 *   return null;
 * });
 * ```
 *
 * @param renderFn - Function that handles rendering
 */

export function directive(renderFn: (container: Node, previousState?: any) => any): IDirectiveResult {
	return {
		__directive: true,
		render: renderFn
	};
}
