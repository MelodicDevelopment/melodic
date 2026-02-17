import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { dashboardPageTemplate } from './dashboard-page.template.js';
import { dashboardPageStyles } from './dashboard-page.styles.js';

export type DashboardLayout = 'default' | 'wide' | 'full';

/**
 * ml-dashboard-page - Composite dashboard layout component
 *
 * Composes ml-app-shell with ml-page-header to provide a complete
 * dashboard page with sidebar, header, metrics row, main content,
 * and optional aside column.
 *
 * @example
 * ```html
 * <ml-dashboard-page title="Dashboard" description="Overview of your account">
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
	attributes: ['title', 'description', 'layout']
})
export class DashboardPageComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Page title */
	title = '';

	/** Page description */
	description = '';

	/** Content layout variant */
	layout: DashboardLayout = 'default';

	/** Check if metrics slot has content */
	get hasMetrics(): boolean {
		return this.elementRef?.querySelector('[slot="metrics"]') !== null;
	}

	/** Check if aside slot has content */
	get hasAside(): boolean {
		return this.elementRef?.querySelector('[slot="aside"]') !== null;
	}

	/** Check if header-actions slot has content */
	get hasHeaderActions(): boolean {
		return this.elementRef?.querySelector('[slot="header-actions"]') !== null;
	}
}
