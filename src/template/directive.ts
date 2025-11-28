/**
 * Directive system for custom rendering behaviors
 *
 * Directives allow you to create reusable, stateful DOM manipulation logic.
 * They receive a DOM node and optional previous state, and can manage
 * complex updates efficiently.
 */

export interface DirectiveResult {
	__directive: true;
	render(container: Node, previousState?: any): any;
}

/**
 * Base class for creating directives.
 *
 * Example:
 * ```typescript
 * class MyDirective extends Directive {
 *   render(container: Node, previousState?: any) {
 *     // Your rendering logic here
 *     return newState; // Returned state will be passed back on next render
 *   }
 * }
 * ```
 */
export abstract class Directive {
	abstract render(container: Node, previousState?: any): any;

	// Mark as directive
	__directive = true as const;
}

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
export function directive(
	renderFn: (container: Node, previousState?: any) => any
): DirectiveResult {
	return {
		__directive: true,
		render: renderFn
	};
}

/**
 * Check if a value is a directive
 */
export function isDirective(value: unknown): value is DirectiveResult {
	return typeof value === 'object' && value !== null && '__directive' in value;
}
