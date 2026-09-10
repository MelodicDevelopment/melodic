import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { appShellTemplate } from './app-shell.template.js';
import { appShellStyles } from './app-shell.styles.js';
import { defineLegacyAliases } from '../../../functions/index.js';
import { focusFirst } from '../../../utils/accessibility/focus-utils.js';

export type SidebarPosition = 'left' | 'right';

/**
 * ml-app-shell - Application shell layout component
 *
 * Provides a sidebar + header + content area layout using CSS Grid.
 *
 * @example
 * ```html
 * <ml-app-shell>
 *   <ml-sidebar slot="sidebar">...</ml-sidebar>
 *   <div slot="header">Page Header</div>
 *   <main>Content</main>
 * </ml-app-shell>
 * ```
 *
 * @slot sidebar - Sidebar navigation area (full height)
 * @slot header - Top header bar in the main area
 * @slot default - Main content area (scrolls independently)
 */
@MelodicComponent({
	selector: 'ml-app-shell',
	template: appShellTemplate,
	styles: appShellStyles,
	attributes: ['sidebar-position', 'sidebar-collapsed', 'header-fixed']
})
export class AppShellComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Position of the sidebar: 'left' or 'right' (attribute: sidebar-position) */
	public sidebarPosition: SidebarPosition = 'left';

	/** Whether the sidebar is collapsed (attribute: sidebar-collapsed) */
	public sidebarCollapsed = false;

	/** Whether the header is fixed/sticky (attribute: header-fixed) */
	public headerFixed = false;

	/** Whether the viewport is mobile-sized (<768px) */
	public mobile = false;

	/** Whether the mobile sidebar drawer is open */
	public mobileOpen = false;

	/** Media query for responsive behavior */
	private _mediaQuery: MediaQueryList | null = null;
	private readonly _handleMediaChange = this.onMediaChange.bind(this);

	/**
	 * The viewport width below which the sidebar becomes a drawer, read from
	 * `--ml-app-shell-mobile-breakpoint`. The value used to be hardcoded in
	 * both the stylesheet and here, so overriding it in CSS left the JS
	 * behaviour switching at the old width.
	 */
	public get mobileBreakpoint(): string {
		const value = getComputedStyle(this.elementRef).getPropertyValue('--ml-app-shell-mobile-breakpoint').trim();
		return value || '768px';
	}

	public onCreate(): void {
		// Read the breakpoint from the same custom property the stylesheet uses,
		// so overriding one no longer desynchronises JS from CSS.
		this._mediaQuery = window.matchMedia(`(min-width: ${this.mobileBreakpoint})`);
		this._mediaQuery.addEventListener('change', this._handleMediaChange);
		this.mobile = !this._mediaQuery.matches;
	}

	public onDestroy(): void {
		this._mediaQuery?.removeEventListener('change', this._handleMediaChange);
	}

	/** Toggle mobile sidebar drawer */
	public toggleMobileSidebar = (): void => {
		this.mobileOpen = !this.mobileOpen;

		if (this.mobileOpen) {
			// Move focus into the drawer so a keyboard user lands where the
			// content is, and Escape has somewhere to close from.
			queueMicrotask(() => {
				const sidebar = this.elementRef.shadowRoot?.querySelector('.ml-app-shell__sidebar') as HTMLElement | null;
				focusFirst(sidebar ?? this.elementRef);
			});
		} else {
			this.focusMenuButton();
		}
	};

	/** Close mobile sidebar */
	public closeMobileSidebar = (): void => {
		if (!this.mobileOpen) {
			return;
		}

		this.mobileOpen = false;
		this.focusMenuButton();
	};

	/**
	 * Escape closes the mobile drawer. It had no keyboard dismissal at all:
	 * the only way out was clicking the backdrop.
	 */
	public handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape' && this.mobileOpen) {
			event.preventDefault();
			this.closeMobileSidebar();
		}
	};

	private focusMenuButton(): void {
		queueMicrotask(() => {
			const button = this.elementRef.shadowRoot?.querySelector('.ml-app-shell__menu-btn') as HTMLElement | null;
			button?.focus();
		});
	}

	private onMediaChange(event: MediaQueryListEvent): void {
		this.mobile = !event.matches;
		if (event.matches) {
			// Switched to desktop: close mobile drawer
			this.mobileOpen = false;
		}
	}
}

// Deprecated quoted kebab-case property aliases (warn once on first write;
// removed in the next major release).
defineLegacyAliases(AppShellComponent.prototype, 'ml-app-shell', {
	'sidebar-position': 'sidebarPosition',
	'sidebar-collapsed': 'sidebarCollapsed',
	'header-fixed': 'headerFixed'
});
