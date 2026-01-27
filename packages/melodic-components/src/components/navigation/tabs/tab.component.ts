import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { tabTemplate } from './tab.template.js';
import { tabStyles } from './tab.styles.js';

/**
 * ml-tab - Individual tab header for use within ml-tabs
 *
 * @example
 * ```html
 * <ml-tabs>
 *   <ml-tab slot="tab" value="tab1" label="First Tab"></ml-tab>
 *   <ml-tab slot="tab" value="tab2" label="Second Tab" icon="gear"></ml-tab>
 *   <ml-tab slot="tab" value="tab3" label="Disabled" disabled></ml-tab>
 * </ml-tabs>
 * ```
 */
@MelodicComponent({
	selector: 'ml-tab',
	template: tabTemplate,
	styles: tabStyles,
	attributes: ['value', 'label', 'icon', 'disabled', 'active', 'href']
})
export class TabComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Tab identifier (must match ml-tab-panel value) */
	value = '';

	/** Tab label text */
	label = '';

	/** Optional icon name */
	icon = '';

	/** Disable this tab */
	disabled = false;

	/** Active state (managed by parent ml-tabs) */
	active = false;

	/** URL for routed tabs */
	href = '';

	/** Handle click on tab */
	handleClick = (): void => {
		if (this.disabled) return;

		// Dispatch event for parent ml-tabs to handle
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-tab-click', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, href: this.href }
			})
		);
	};
}
