import { registerAttributeDirective } from '../functions/attribute-directive.functions';
import type { AttributeDirectiveCleanupFunction } from '../types/attribute-directive-cleanup-function.type';

/**
 * Options for the portal directive when using object syntax
 */
export interface PortalOptions {
	/** Target element or selector where content will be teleported */
	target: string | Element;

	/** Keep content in target after source component unmounts (default: false) */
	persist?: boolean;
}

/**
 * Portal directive value - can be string selector, Element, or options object
 */
export type PortalValue = string | Element | PortalOptions;

/**
 * Resolve target from string selector or Element
 */
function resolveTarget(target: string | Element): Element | null {
	if (typeof target === 'string') {
		return document.querySelector(target);
	}
	return target;
}

/**
 * Parse portal value into normalized options
 */
function parsePortalValue(value: PortalValue): PortalOptions {
	if (typeof value === 'string') {
		return { target: value, persist: false };
	}

	if (value instanceof Element) {
		return { target: value, persist: false };
	}

	return {
		target: value.target,
		persist: value.persist ?? false
	};
}

/**
 * Portal attribute directive - Teleports an element to a different location in the DOM
 *
 * Usage:
 * ```html
 * <!-- Basic - teleport to body -->
 * <div class="modal" :portal="body">...</div>
 *
 * <!-- Teleport to specific container -->
 * <div class="tooltip" :portal="#tooltip-root">...</div>
 *
 * <!-- Dynamic target -->
 * <div class="dropdown" :portal=${this.container}>...</div>
 *
 * <!-- With options (persist after unmount) -->
 * <div class="toast" :portal=${{ target: '#notifications', persist: true }}>...</div>
 * ```
 */
function portalDirective(element: Element, value: unknown, _: string): AttributeDirectiveCleanupFunction | void {
	if (!value) {
		console.warn('portal directive: value is required');
		return;
	}

	const options = parsePortalValue(value as PortalValue);
	const targetElement = resolveTarget(options.target);

	if (!targetElement) {
		console.warn(`portal directive: target "${options.target}" not found`);
		return;
	}

	// Don't teleport if already in target
	if (element.parentNode === targetElement) {
		return;
	}

	// Create placeholder comment at original position
	const placeholder = document.createComment('portal-placeholder');
	element.parentNode?.insertBefore(placeholder, element);

	// Remove portal attribute to avoid re-processing
	element.removeAttribute(':portal');

	// Move element to target
	targetElement.appendChild(element);

	// Return cleanup function
	return () => {
		if (!options.persist) {
			// Remove from target
			element.remove();
		}

		// Remove placeholder
		placeholder.remove();
	};
}

// Register the directive
registerAttributeDirective('portal', portalDirective);

export { portalDirective };
