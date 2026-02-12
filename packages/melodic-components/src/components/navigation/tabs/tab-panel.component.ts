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
	elementRef!: HTMLElement;

	/** Panel identifier (must match ml-tab value) */
	value = '';
}
