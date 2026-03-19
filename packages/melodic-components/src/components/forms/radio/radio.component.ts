import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { radioTemplate } from './radio.template.js';
import { radioStyles } from './radio.styles.js';

/**
 * ml-radio - Radio input component
 *
 * @example
 * ```html
 * <ml-radio name="choice" value="a" label="Option A"></ml-radio>
 * <ml-radio name="choice" value="b" label="Option B" checked></ml-radio>
 * ```
 *
 * @fires ml:change - Emitted when selected
 */
@MelodicComponent({
	selector: 'ml-radio',
	template: radioTemplate,
	styles: radioStyles,
	attributes: ['name', 'value', 'label', 'hint', 'size', 'checked', 'disabled']
})
export class RadioComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Radio group name */
	public name = '';

	/** Radio value */
	public value = '';

	/** Radio label */
	public label = '';

	/** Hint text */
	public hint = '';

	/** Radio size */
	public size: Size = 'md';

	/** Checked state */
	public checked = false;

	/** Disabled state */
	public disabled = false;

	public handleChange = (): void => {
		this.checked = true;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value, checked: true }
			})
		);
	};
}
