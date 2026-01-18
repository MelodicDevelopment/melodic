import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { checkboxTemplate } from './checkbox.template.js';
import { checkboxStyles } from './checkbox.styles.js';

/**
 * ml-checkbox - Checkbox input component
 *
 * @example
 * ```html
 * <ml-checkbox label="Accept terms"></ml-checkbox>
 * <ml-checkbox label="Subscribe" checked></ml-checkbox>
 * <ml-checkbox label="Indeterminate" indeterminate></ml-checkbox>
 * ```
 *
 * @fires ml-change - Emitted when checked state changes
 */
@MelodicComponent({
	selector: 'ml-checkbox',
	template: checkboxTemplate,
	styles: checkboxStyles,
	attributes: ['label', 'hint', 'size', 'checked', 'indeterminate', 'disabled']
})
export class Checkbox implements IElementRef {
	elementRef!: HTMLElement;

	/** Checkbox label */
	label = '';

	/** Hint text below the checkbox */
	hint = '';

	/** Checkbox size */
	size: Size = 'md';

	/** Checked state */
	checked = false;

	/** Indeterminate state */
	indeterminate = false;

	/** Disabled state */
	disabled = false;

	handleChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.checked = target.checked;
		this.indeterminate = false;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			})
		);
	};
}
