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
	public elementRef!: HTMLElement;

	/** Tab identifier (must match ml-tab-panel value) */
	public value = '';

	/** Tab label text */
	public label = '';

	/** Optional icon name */
	public icon = '';

	/** Disable this tab */
	public disabled = false;

	/** Active state (managed by parent ml-tabs) */
	public active = false;

	/** URL for routed tabs */
	public href = '';

	/** Handle click on tab */
	public handleClick = (): void => {
		if (this.disabled) return;

		// Dispatch event for parent ml-tabs to handle
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:tab-click', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, href: this.href }
			})
		);
	};
}
