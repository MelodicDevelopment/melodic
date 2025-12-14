/**
 * Attribute directive function signature.
 *
 * @param element - The DOM element the directive is attached to
 * @param value - The value passed to the directive (string or dynamic)
 * @param name - The directive name (e.g., 'routerLink')
 * @returns Optional cleanup function called when element is removed or directive updates
 */
export type AttributeDirectiveFunction = (
	element: Element,
	value: unknown,
	name: string
) => (() => void) | void;

/**
 * Registry for attribute directives.
 * Directives are registered by name and looked up when the template system
 * encounters a `:directiveName` binding.
 */
const directiveRegistry = new Map<string, AttributeDirectiveFunction>();

/**
 * Register an attribute directive.
 *
 * @example
 * ```typescript
 * registerAttributeDirective('tooltip', (element, value) => {
 *   // Setup tooltip with value as content
 *   const tooltip = createTooltip(element, value as string);
 *   return () => tooltip.destroy();
 * });
 * ```
 *
 * Then use in templates:
 * ```html
 * <button :tooltip="Click me!">Hover</button>
 * ```
 */
export function registerAttributeDirective(name: string, directive: AttributeDirectiveFunction): void {
	directiveRegistry.set(name, directive);
}

/**
 * Get a registered attribute directive by name.
 * Performs case-insensitive lookup since HTML attributes are lowercased by the browser.
 */
export function getAttributeDirective(name: string): AttributeDirectiveFunction | undefined {
	// First try exact match
	const exact = directiveRegistry.get(name);
	if (exact) return exact;

	// Try case-insensitive match (browser lowercases HTML attributes)
	const lowerName = name.toLowerCase();
	for (const [key, value] of directiveRegistry) {
		if (key.toLowerCase() === lowerName) {
			return value;
		}
	}
	return undefined;
}

/**
 * Check if an attribute directive is registered.
 * Performs case-insensitive check since HTML attributes are lowercased by the browser.
 */
export function hasAttributeDirective(name: string): boolean {
	if (directiveRegistry.has(name)) return true;

	const lowerName = name.toLowerCase();
	for (const key of directiveRegistry.keys()) {
		if (key.toLowerCase() === lowerName) {
			return true;
		}
	}
	return false;
}

/**
 * Unregister an attribute directive.
 */
export function unregisterAttributeDirective(name: string): boolean {
	return directiveRegistry.delete(name);
}

/**
 * Get all registered directive names.
 */
export function getRegisteredDirectives(): string[] {
	return Array.from(directiveRegistry.keys());
}
