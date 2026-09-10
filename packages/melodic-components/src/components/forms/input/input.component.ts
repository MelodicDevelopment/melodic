import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import type { ControlSize } from '../../../types/index.js';
import type { InputType } from './input.types.js';
import { inputTemplate } from './input.template.js';
import { inputStyles } from './input.styles.js';

registerAdapter<string>((el) => el.tagName === 'ML-INPUT', {
	inputEvent: 'ml:input',
	blurEvent: 'focusout',
	getValue: (el) => (el as unknown as { value: string }).value ?? '',
	setValue: (el, value) => { (el as unknown as { value: string }).value = value !== null && value !== undefined ? String(value) : ''; },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

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
 * @fires ml:input - Emitted on input
 * @fires ml:change - Emitted on change (blur)
 * @fires ml:focus - Emitted on focus
 * @fires ml:blur - Emitted on blur
 */
@MelodicComponent({
	selector: 'ml-input',
	template: inputTemplate,
	styles: inputStyles,
	attributes: [
		'type',
		'value',
		'placeholder',
		'label',
		'hint',
		'error',
		'size',
		'disabled',
		'readonly',
		'required',
		'autocomplete',
		'name',
		'maxlength',
		'minlength',
		'min',
		'max',
		'step',
		'pattern',
		'inputmode'
	]
})
export class InputComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Input type */
	public type: InputType = 'text';

	/** Current value */
	public value = '';

	/** Placeholder text */
	public placeholder = '';

	/** Label text */
	public label = '';

	/** Hint text shown below input */
	public hint = '';

	/** Error message (shows error state when set) */
	public error = '';

	/** Input size */
	public size: ControlSize = 'md';

	/** Disable the input */
	public disabled = false;

	/** Make input readonly */
	public readonly = false;

	/** Mark as required */
	public required = false;

	/** Autocomplete attribute */
	public autocomplete = 'off';

	/** Internal focus state */
	public focused = false;

	/** Form field name, forwarded to the inner input. */
	public name = '';

	/** Maximum input length. */
	public maxlength: number | null = null;

	/** Minimum input length. */
	public minlength: number | null = null;

	/** Minimum value (number/date types). */
	public min: string = '';

	/** Maximum value (number/date types). */
	public max: string = '';

	/** Step (number/date types). */
	public step: string = '';

	/** Validation pattern. */
	public pattern = '';

	/** Virtual-keyboard hint. */
	public inputmode = '';

	/**
	 * Accessible name for the inner control when there is no visible label.
	 *
	 * An `aria-label` set on the HOST names the custom element, not the
	 * `<input>` inside its shadow root — which is the node a screen reader
	 * actually reaches — so an unlabelled field announced nothing useful.
	 */
	public get fieldLabel(): string {
		return this.label || this.elementRef?.getAttribute('aria-label') || this.placeholder || '';
	}

	public handleInput = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = target.value;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:input', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	public handleChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = target.value;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	public handleFocus = (): void => {
		this.focused = true;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:focus', {
				bubbles: true,
				composed: true
			})
		);
	};

	public handleBlur = (): void => {
		this.focused = false;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:blur', {
				bubbles: true,
				composed: true
			})
		);
	};
}
