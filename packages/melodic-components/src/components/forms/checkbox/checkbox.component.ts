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
 * @fires ml:change - Emitted when checked state changes
 */
@MelodicComponent({
	selector: 'ml-checkbox',
	template: checkboxTemplate,
	styles: checkboxStyles,
	attributes: ['label', 'hint', 'size', 'checked', 'indeterminate', 'disabled']
})
export class CheckboxComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Checkbox label */
	public label = '';

	/** Hint text below the checkbox */
	public hint = '';

	/** Checkbox size */
	public size: Size = 'md';

	/** Checked state */
	public checked = false;

	/** Indeterminate state */
	public indeterminate = false;

	/** Disabled state */
	public disabled = false;

	public handleChange = (event: Event): void => {
		if (this.disabled) {
			event.preventDefault();
			return;
		}

		const target = event.target as HTMLInputElement;
		this.checked = target.checked;
		this.indeterminate = false;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { checked: this.checked }
			})
		);
	};
}
