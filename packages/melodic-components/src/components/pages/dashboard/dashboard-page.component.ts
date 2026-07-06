import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { dashboardPageTemplate } from './dashboard-page.template.js';
import { dashboardPageStyles } from './dashboard-page.styles.js';

export type DashboardLayout = 'default' | 'wide' | 'full';

let warnedDeprecatedTitle = false;
function warnDeprecatedTitle(): void {
	if (warnedDeprecatedTitle) return;
	warnedDeprecatedTitle = true;
	console.warn(
		'[ml-dashboard-page] The "title" attribute/property is deprecated because it collides with the global HTML title attribute (native tooltip). Use "page-title" instead. The "title" shim will be removed in the next major release.'
	);
}

/**
 * ml-dashboard-page - Composite dashboard layout component
 *
 * Composes ml-app-shell with ml-page-header to provide a complete
 * dashboard page with sidebar, header, metrics row, main content,
 * and optional aside column.
 *
 * @example
 * ```html
 * <ml-dashboard-page page-title="Dashboard" description="Overview of your account">
 *   <ml-sidebar slot="sidebar">...</ml-sidebar>
 *   <ml-button slot="header-actions" variant="primary">Create</ml-button>
 *   <ml-stat slot="metrics">...</ml-stat>
 *   <div slot="main">Main content</div>
 *   <div slot="aside">Activity feed</div>
 * </ml-dashboard-page>
 * ```
 *
 * @slot sidebar - Sidebar content (passed through to app shell)
 * @slot header-actions - Action buttons for the page header
 * @slot metrics - Stat/metric cards row
 * @slot main - Primary content area (tables, charts)
 * @slot aside - Secondary content (activity feed, notifications)
 */
@MelodicComponent({
	selector: 'ml-dashboard-page',
	template: dashboardPageTemplate,
	styles: dashboardPageStyles,
	attributes: ['page-title', 'title', 'description', 'layout']
})
export class DashboardPageComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Page title (attribute: page-title) */
	public pageTitle = '';

	/** Page description */
	public description = '';

	/** @deprecated Use `pageTitle` (attribute `page-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.pageTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitle();
		this.pageTitle = value;
	}

	/** Content layout variant */
	public layout: DashboardLayout = 'default';

	/** Whether the metrics slot has content (kept in sync via MutationObserver) */
	public hasMetrics = false;

	/** Whether the aside slot has content (kept in sync via MutationObserver) */
	public hasAside = false;

	/** Whether the header-actions slot has content (kept in sync via MutationObserver) */
	public hasHeaderActions = false;

	private _slotObserver: MutationObserver | null = null;

	public onCreate(): void {
		// Slot presence must be reactive so content added or removed after mount
		// projects correctly (same bug class fixed with slotchange in
		// profile-card/page-header). The slotchange pattern cannot be used here:
		// these shadow slots are conditionally rendered (chicken-and-egg — the
		// slot that would fire slotchange only exists once the flag is already
		// true), and the header-actions slot is chained into ml-page-header's
		// actions slot, so rendering it unconditionally would make page-header
		// consider its actions section non-empty. Watch the light DOM instead.
		this._slotObserver = new MutationObserver(() => this.syncSlotFlags());
		this._slotObserver.observe(this.elementRef, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['slot']
		});
		this.syncSlotFlags();
	}

	public onDestroy(): void {
		this._slotObserver?.disconnect();
		this._slotObserver = null;
	}

	private syncSlotFlags(): void {
		this.hasMetrics = this.elementRef.querySelector('[slot="metrics"]') !== null;
		this.hasAside = this.elementRef.querySelector('[slot="aside"]') !== null;
		this.hasHeaderActions = this.elementRef.querySelector('[slot="header-actions"]') !== null;
	}
}
