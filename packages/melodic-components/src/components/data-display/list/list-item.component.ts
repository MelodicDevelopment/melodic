import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { listItemTemplate } from './list-item.template.js';
import { listItemStyles } from './list-item.styles.js';

/**
 * ml-list-item - Individual item within a list
 *
 * @example
 * ```html
 * <ml-list-item primary="Phoenix Baker" secondary="Member since Feb 2025">
 *   <ml-avatar slot="leading" initials="PB"></ml-avatar>
 *   <ml-badge slot="trailing" variant="pill" color="success">Active</ml-badge>
 * </ml-list-item>
 * ```
 *
 * @slot leading - Left side content (avatars, icons, images)
 * @slot default - Main content (overrides primary/secondary text)
 * @slot trailing - Right side content (badges, indicators, actions)
 */
@MelodicComponent({
	selector: 'ml-list-item',
	template: listItemTemplate,
	styles: listItemStyles,
	attributes: ['primary', 'secondary', 'disabled', 'interactive']
})
export class ListItemComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Primary text */
	public primary = '';

	/** Secondary text */
	public secondary = '';

	/** Disable the item */
	public disabled = false;

	/** Enable hover/focus states for clickable items */
	public interactive = false;

	/** Check if leading slot has content */
	public get hasLeadingSlot(): boolean {
		return this.elementRef?.querySelector('[slot="leading"]') !== null;
	}

	/** Check if trailing slot has content */
	public get hasTrailingSlot(): boolean {
		return this.elementRef?.querySelector('[slot="trailing"]') !== null;
	}

}
