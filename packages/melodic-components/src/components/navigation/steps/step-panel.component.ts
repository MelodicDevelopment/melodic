import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { stepPanelTemplate } from './step-panel.template.js';
import { stepPanelStyles } from './step-panel.styles.js';

/**
 * ml-step-panel - Step panel content for use within ml-steps
 *
 * @example
 * ```html
 * <ml-steps active="step1">
 *   <ml-step-panel value="step1">Step 1 content</ml-step-panel>
 *   <ml-step-panel value="step2">Step 2 content</ml-step-panel>
 * </ml-steps>
 * ```
 */
@MelodicComponent({
	selector: 'ml-step-panel',
	template: stepPanelTemplate,
	styles: stepPanelStyles,
	attributes: ['value']
})
export class StepPanelComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Panel identifier (must match ml-step value) */
	public value = '';

	/**
	 * Accessible name for the panel, kept in sync with the matching step's
	 * label by the parent ml-steps. ARIA id references cannot cross shadow-root
	 * boundaries, so the step/panel association is carried by name (aria-label)
	 * rather than aria-labelledby.
	 */
	public panelLabel = '';
}
