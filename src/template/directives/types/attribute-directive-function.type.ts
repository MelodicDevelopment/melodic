import type { AttributeDirectiveCleanupFunction } from './attribute-directive-cleanup-function.type';

/**
 * Attribute directive function signature.
 *
 * @param element - The DOM element the directive is attached to
 * @param value - The value passed to the directive (string or dynamic)
 * @param name - The directive name (e.g., 'routerLink')
 * @returns Optional cleanup function called when element is removed or directive updates
 */

export type AttributeDirectiveFunction = (element: Element, value: unknown, name: string) => AttributeDirectiveCleanupFunction | void;
