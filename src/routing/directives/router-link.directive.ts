import { registerAttributeDirective } from '../../template/directives/functions/attribute-directive.functions';
import type { AttributeDirectiveCleanupFunction } from '../../template/directives/types/attribute-directive-cleanup-function.type';
import { RouterLinkCore } from '../classes/router-link-core.class';
import type { IRouterLinkOptions } from '../classes/router-link-core.class';

// Re-exported for backwards compatibility — the options interface now lives
// with the shared RouterLinkCore.
export type { IRouterLinkOptions } from '../classes/router-link-core.class';

/**
 * Router link attribute directive.
 *
 * Usage:
 * ```html
 * <!-- Static string value -->
 * <a :routerLink="/home">Home</a>
 * <button :routerLink="/admin">Admin</button>
 *
 * <!-- Dynamic string value -->
 * <a :routerLink=${currentPath}>Dynamic</a>
 *
 * <!-- Object with options -->
 * <a :routerLink=${{ href: '/about', exactMatch: true }}>About</a>
 * ```
 *
 * The directive (behavior shared with `<router-link>` via `RouterLinkCore`):
 * - Sets href attribute on anchor elements (for accessibility)
 * - Handles click events with preventDefault and navigation
 * - Preserves native modifier/middle-click behavior (new tab, etc.)
 * - Rejects unsafe URL schemes (`javascript:` etc.)
 * - Manages active class based on current route
 * - Listens for navigation events to update active state
 */
function routerLinkDirective(element: Element, value: unknown, _: string): (() => void) | void {
	// Parse value - can be string or options object
	let options: IRouterLinkOptions;

	if (typeof value === 'string') {
		options = { href: value };
	} else if (value && typeof value === 'object' && 'href' in value) {
		options = value as IRouterLinkOptions;
	} else {
		console.warn('routerLink: Invalid value. Expected string or { href: string, ... }');
		return;
	}

	const core = new RouterLinkCore(element);
	core.setOptions(options);

	// Marker attribute for styling hooks.
	element.setAttribute('router-link', '');

	// Return cleanup function
	return (() => {
		core.destroy();
	}) as AttributeDirectiveCleanupFunction;
}

// Auto-register the directive
registerAttributeDirective('routerLink', routerLinkDirective);

// Export for manual registration if needed
export { routerLinkDirective };
