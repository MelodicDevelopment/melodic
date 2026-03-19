import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { StepStatus, StepsVariant, StepsConnector, StepsColor, StepsOrientation } from './steps.types.js';
import { stepTemplate } from './step.template.js';
import { stepStyles } from './step.styles.js';

/**
 * ml-step - Individual step header for use within ml-steps
 *
 * @example
 * ```html
 * <ml-steps active="step1">
 *   <ml-step slot="step" value="step1" label="Your details" description="Name and email"></ml-step>
 *   <ml-step slot="step" value="step2" label="Company" description="Your company details"></ml-step>
 * </ml-steps>
 * ```
 */
@MelodicComponent({
	selector: 'ml-step',
	template: stepTemplate,
	styles: stepStyles,
	attributes: ['value', 'label', 'description', 'icon', 'disabled', 'status', 'variant', 'connector', 'color', 'orientation', 'step-number', 'first', 'last', 'compact']
})
export class StepComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Step identifier */
	public value = '';

	/** Step title */
	public label = '';

	/** Secondary description text */
	public description = '';

	/** Icon name (for icons variant) */
	public icon = '';

	/** URL for routed mode */
	public href = '';

	/** Disable this step */
	public disabled = false;

	/** Step status (managed by parent) */
	public status: StepStatus = 'upcoming';

	/** Visual variant (managed by parent) */
	public variant: StepsVariant = 'numbered';

	/** Connector style (managed by parent) */
	public connector: StepsConnector = 'solid';

	/** Accent color (managed by parent) */
	public color: StepsColor = 'primary';

	/** Layout orientation (managed by parent) */
	public orientation: StepsOrientation = 'horizontal';

	/** Step number (managed by parent) */
	public 'step-number' = '1';

	/** First step flag (managed by parent) */
	public first = false;

	/** Last step flag (managed by parent) */
	public last = false;

	/** Compact/dots mode (managed by parent) */
	public compact = false;

	/** Handle click on step */
	public handleClick = (): void => {
		if (this.disabled) return;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:step-click', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, href: this.href }
			})
		);
	};
}
