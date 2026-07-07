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
 * @param type - Optional identity of the directive factory. When provided, the
 *   engine uses it to detect a binding switching between two different
 *   directive types (the old directive's state is disposed instead of being
 *   passed to the new directive). Directives that own nested rendered content
 *   should also implement `__dispose` on their state (see IDirectiveState).
 */

export function directive(renderFn: (container: Node, previousState?: any) => any, type?: string | symbol): IDirectiveResult {
	return {
		__directive: true,
		type,
		render: renderFn
	};
}
