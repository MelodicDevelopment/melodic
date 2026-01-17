import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import type { Orientation } from '../../../types/index.js';
import { radioGroupTemplate } from './radio-group.template.js';
import { radioGroupStyles } from './radio-group.styles.js';

/**
 * ml-radio-group - Container for radio buttons
 *
 * @example
 * ```html
 * <ml-radio-group label="Select option" name="options">
 *   <ml-radio value="a" label="Option A"></ml-radio>
 *   <ml-radio value="b" label="Option B"></ml-radio>
 * </ml-radio-group>
 * ```
 *
 * @fires ml-change - Emitted when selection changes
 */
@MelodicComponent({
	selector: 'ml-radio-group',
	template: radioGroupTemplate,
	styles: radioGroupStyles,
	attributes: ['label', 'name', 'value', 'hint', 'error', 'orientation', 'disabled', 'required']
})
export class RadioGroup implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	/** Group label */
	label = '';

	/** Form field name */
	name = '';

	/** Current selected value */
	value = '';

	/** Hint text */
	hint = '';

	/** Error message */
	error = '';

	/** Layout orientation */
	orientation: Orientation = 'vertical';

	/** Disabled state */
	disabled = false;

	/** Required state */
	required = false;

	onInit(): void {
		// Listen for changes from child radios
		this.elementRef.addEventListener('ml-change', this.handleChildChange as EventListener);

		// Set initial name on child radios
		this.updateChildRadios();
	}

	private handleChildChange = (event: CustomEvent): void => {
		if (event.target === this.elementRef) {
			return;
		}

		const detail = event.detail as { value: string };
		this.value = detail.value;

		// Update checked state on all child radios
		this.updateChildRadios();

		// Re-emit the event
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	private updateChildRadios(): void {
		const radios = this.elementRef.querySelectorAll('ml-radio');
		if (this.value === '') {
			for (const radio of radios) {
				const isChecked = (radio as any).checked === true || radio.hasAttribute('checked');
				if (isChecked) {
					this.value = (radio as any).value ?? radio.getAttribute('value') ?? '';
					break;
				}
			}
		}

		radios.forEach((radio) => {
			if (this.name) {
				(radio as any).name = this.name;
			}

			(radio as any).disabled = this.disabled;

			const radioValue = (radio as any).value ?? radio.getAttribute('value') ?? '';
			(radio as any).checked = this.value !== '' && radioValue === this.value;
		});
	}
}
