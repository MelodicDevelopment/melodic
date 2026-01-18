import { Injector } from '../../injection';
import { registerAttributeDirective } from '../../template/directives/functions/attribute-directive.functions';
import type { AttributeDirectiveCleanupFunction } from '../../template/directives/types/attribute-directive-cleanup-function.type';
import { RouterService } from '../services/router.service';
import type { INavigationOptions } from '../interfaces/inavigation-options.interface';

/**
 * Options for the routerLink directive when using object syntax.
 */
export interface IRouterLinkOptions {
	/** Target path for navigation */
	href: string;

	/** CSS class to apply when this link is active (default: 'active') */
	activeClass?: string;

	/** Whether to match exact path or prefix (default: false) */
	exactMatch?: boolean;

	/** Whether to replace history instead of push (default: false) */
	replace?: boolean;

	/** Custom data to pass with navigation */
	data?: unknown;

	/** Query parameters to append */
	queryParams?: Record<string, string>;
}

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
 * The directive:
 * - Sets href attribute on anchor elements (for accessibility)
 * - Handles click events with preventDefault and navigation
 * - Supports modifier keys (ctrl/cmd opens in new tab)
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

	const { href, activeClass = 'active', exactMatch = false, replace = false, data = null, queryParams = {} } = options;

	const router = Injector.get<RouterService>(RouterService);

	// Build full path with query params
	const buildFullPath = (): string => {
		let path = href;
		if (queryParams && Object.keys(queryParams).length > 0) {
			const params = new URLSearchParams(queryParams);
			path = `${path}?${params.toString()}`;
		}
		return path;
	};

	// Set href on anchor elements for accessibility
	if (element.tagName.toLowerCase() === 'a') {
		(element as HTMLAnchorElement).href = buildFullPath();
	}

	// Update active state
	const updateActiveState = (): void => {
		const currentPath = window.location.pathname;
		const linkPath = href.startsWith('/') ? href : `/${href}`;
		const normalizedCurrentPath = currentPath.replace(/\/$/, '') || '/';
		const normalizedLinkPath = linkPath.replace(/\/$/, '') || '/';

		let isActive: boolean;

		if (exactMatch) {
			isActive = normalizedCurrentPath === normalizedLinkPath;
		} else {
			isActive = normalizedCurrentPath === normalizedLinkPath || normalizedCurrentPath.startsWith(normalizedLinkPath + '/');
		}

		if (isActive) {
			element.classList.add(activeClass);
			if (element.tagName.toLowerCase() === 'a') {
				element.setAttribute('aria-current', 'page');
			}
		} else {
			element.classList.remove(activeClass);
			element.removeAttribute('aria-current');
		}

		element.setAttribute('router-link', '');
	};

	// Click handler
	const handleClick = (e: Event): void => {
		const mouseEvent = e as MouseEvent;

		// Don't navigate if modifier keys are pressed (allow new tab, etc.)
		if (mouseEvent.ctrlKey || mouseEvent.metaKey || mouseEvent.shiftKey) {
			if (element.tagName.toLowerCase() === 'a') {
				// Let the browser handle it naturally for anchors
				return;
			}
			// For non-anchor elements, open in new tab
			window.open(buildFullPath(), '_blank');
			return;
		}

		e.preventDefault();

		const navOptions: INavigationOptions = {
			data,
			replace,
			queryParams
		};

		router.navigate(href, navOptions);
	};

	// Navigation event handler
	const handleNavigation = (): void => {
		updateActiveState();
	};

	// Add event listeners
	element.addEventListener('click', handleClick);
	window.addEventListener('NavigationEvent', handleNavigation);

	// Initial active state
	updateActiveState();

	// Return cleanup function
	return (() => {
		element.removeEventListener('click', handleClick);
		window.removeEventListener('NavigationEvent', handleNavigation);
	}) as AttributeDirectiveCleanupFunction;
}

// Auto-register the directive
registerAttributeDirective('routerLink', routerLinkDirective);

// Export for manual registration if needed
export { routerLinkDirective };
