import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { sidebarGroupTemplate } from './sidebar-group.template.js';
import { sidebarGroupStyles } from './sidebar-group.styles.js';

/**
 * ml-sidebar-group - Section group with optional heading for sidebar navigation
 *
 * @example
 * ```html
 * <ml-sidebar-group label="GENERAL">
 *   <ml-sidebar-item icon="house" label="Home" value="home"></ml-sidebar-item>
 *   <ml-sidebar-item icon="chart-bar" label="Dashboard" value="dashboard"></ml-sidebar-item>
 * </ml-sidebar-group>
 * ```
 *
 * @slot default - Sidebar items
 */
@MelodicComponent({
	selector: 'ml-sidebar-group',
	template: sidebarGroupTemplate,
	styles: sidebarGroupStyles,
	attributes: ['label', 'collapsed']
})
export class SidebarGroupComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Group heading label */
	label = '';

	/** Collapsed state (set by parent sidebar) */
	collapsed = false;
}
