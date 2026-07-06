import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { tabPanelTemplate } from './tab-panel.template.js';
import { tabPanelStyles } from './tab-panel.styles.js';

/**
 * ml-tab-panel - Tab panel content for use within ml-tabs
 *
 * @example
 * ```html
 * <ml-tabs value="tab1">
 *   <ml-tab slot="tab" value="tab1" label="First"></ml-tab>
 *   <ml-tab slot="tab" value="tab2" label="Second"></ml-tab>
 *   <ml-tab-panel value="tab1">First panel content</ml-tab-panel>
 *   <ml-tab-panel value="tab2">Second panel content</ml-tab-panel>
 * </ml-tabs>
 * ```
 */
@MelodicComponent({
	selector: 'ml-tab-panel',
	template: tabPanelTemplate,
	styles: tabPanelStyles,
	attributes: ['value']
})
export class TabPanelComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Panel identifier (must match ml-tab value) */
	public value = '';

	/**
	 * Accessible name for the tabpanel, kept in sync with the matching tab's
	 * label by the parent ml-tabs. ARIA id references cannot cross shadow-root
	 * boundaries, so the tab/panel association is carried by name (aria-label)
	 * rather than aria-labelledby.
	 */
	public panelLabel = '';
}
