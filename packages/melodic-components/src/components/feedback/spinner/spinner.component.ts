import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { spinnerTemplate } from './spinner.template.js';
import { spinnerStyles } from './spinner.styles.js';

/**
 * ml-spinner - Loading spinner component
 *
 * @example
 * ```html
 * <ml-spinner></ml-spinner>
 * <ml-spinner size="lg"></ml-spinner>
 * <ml-spinner label="Loading data..."></ml-spinner>
 * ```
 */
@MelodicComponent({
	selector: 'ml-spinner',
	template: spinnerTemplate,
	styles: spinnerStyles,
	attributes: ['size', 'label']
})
export class SpinnerComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Size of the spinner */
	size: Size = 'md';

	/** Accessible label for screen readers */
	label = 'Loading';
}
