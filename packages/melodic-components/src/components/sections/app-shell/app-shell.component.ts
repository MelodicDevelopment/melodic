import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { appShellTemplate } from './app-shell.template.js';
import { appShellStyles } from './app-shell.styles.js';

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
	elementRef!: HTMLElement;

	/** Position of the sidebar: 'left' or 'right' */
	'sidebar-position': SidebarPosition = 'left';

	/** Whether the sidebar is collapsed */
	'sidebar-collapsed' = false;

	/** Whether the header is fixed/sticky */
	'header-fixed' = false;

	/** Whether the viewport is mobile-sized (<768px) */
	mobile = false;

	/** Whether the mobile sidebar drawer is open */
	mobileOpen = false;

	/** Media query for responsive behavior */
	private _mediaQuery: MediaQueryList | null = null;
	private readonly _handleMediaChange = this.onMediaChange.bind(this);

	onCreate(): void {
		this._mediaQuery = window.matchMedia('(min-width: 768px)');
		this._mediaQuery.addEventListener('change', this._handleMediaChange);
		this.mobile = !this._mediaQuery.matches;
	}

	onDestroy(): void {
		this._mediaQuery?.removeEventListener('change', this._handleMediaChange);
	}

	/** Toggle mobile sidebar drawer */
	toggleMobileSidebar = (): void => {
		this.mobileOpen = !this.mobileOpen;
	};

	/** Close mobile sidebar */
	closeMobileSidebar = (): void => {
		this.mobileOpen = false;
	};

	private onMediaChange(event: MediaQueryListEvent): void {
		this.mobile = !event.matches;
		if (event.matches) {
			// Switched to desktop: close mobile drawer
			this.mobileOpen = false;
		}
	}
}
