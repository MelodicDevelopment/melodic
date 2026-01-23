import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { InputType } from './input.types.js';
import { inputTemplate } from './input.template.js';
import { inputStyles } from './input.styles.js';

/**
 * ml-input - Text input component with label, hint, and error states
 *
 * @example
 * ```html
 * <ml-input label="Email" type="email" placeholder="Enter email"></ml-input>
 * <ml-input label="Password" type="password" required></ml-input>
 * <ml-input label="Name" hint="Enter your full name"></ml-input>
 * <ml-input label="Username" error="Username is taken"></ml-input>
 * ```
 *
 * @slot prefix - Content before the input (icon, text)
 * @slot suffix - Content after the input (icon, button)
 *
 * @fires ml-input - Emitted on input
 * @fires ml-change - Emitted on change (blur)
 * @fires ml-focus - Emitted on focus
 * @fires ml-blur - Emitted on blur
 */
@MelodicComponent({
	selector: 'ml-input',
	template: inputTemplate,
	styles: inputStyles,
	attributes: ['type', 'value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'readonly', 'required', 'autocomplete']
})
export class InputComponent implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	/** Input type */
	type: InputType = 'text';

	/** Current value */
	value = '';

	/** Placeholder text */
	placeholder = '';

	/** Label text */
	label = '';

	/** Hint text shown below input */
	hint = '';

	/** Error message (shows error state when set) */
	error = '';

	/** Input size */
	size: Size = 'md';

	/** Disable the input */
	disabled = false;

	/** Make input readonly */
	readonly = false;

	/** Mark as required */
	required = false;

	/** Autocomplete attribute */
	autocomplete = 'off';

	/** Internal focus state */
	_focused = false;

	onInit(): void {
		// Set up aria-label if no label provided
		if (!this.label && this.placeholder) {
			this.elementRef.setAttribute('aria-label', this.placeholder);
		}
	}

	handleInput = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = target.value;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-input', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	handleChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = target.value;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml-change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	handleFocus = (): void => {
		this._focused = true;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-focus', {
				bubbles: true,
				composed: true
			})
		);
	};

	handleBlur = (): void => {
		this._focused = false;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml-blur', {
				bubbles: true,
				composed: true
			})
		);
	};
}
