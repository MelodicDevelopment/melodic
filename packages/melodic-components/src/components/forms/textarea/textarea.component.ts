import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import type { Size } from '../../../types/index.js';
import { textareaTemplate } from './textarea.template.js';
import { textareaStyles } from './textarea.styles.js';

registerAdapter<string>((el) => el.tagName === 'ML-TEXTAREA', {
	inputEvent: 'ml:input',
	blurEvent: 'focusout',
	getValue: (el) => (el as unknown as { value: string }).value ?? '',
	setValue: (el, value) => { (el as unknown as { value: string }).value = value !== null && value !== undefined ? String(value) : ''; },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

/**
 * ml-textarea - Multi-line text input component
 *
 * @example
 * ```html
 * <ml-textarea label="Description" placeholder="Enter description"></ml-textarea>
 * <ml-textarea label="Bio" rows="5" max-length="500"></ml-textarea>
 * <ml-textarea label="Notes" auto-resize></ml-textarea>
 * ```
 *
 * @fires ml:input - Emitted on input
 * @fires ml:change - Emitted on change (blur)
 * @fires ml:focus - Emitted on focus
 * @fires ml:blur - Emitted on blur
 */
@MelodicComponent({
	selector: 'ml-textarea',
	template: textareaTemplate,
	styles: textareaStyles,
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'rows', 'max-length', 'disabled', 'readonly', 'required', 'resize']
})
export class TextareaComponent implements IElementRef, OnInit {
	public elementRef!: HTMLElement;

	/** Current value */
	public value = '';

	/** Placeholder text */
	public placeholder = '';

	/** Label text */
	public label = '';

	/** Hint text shown below textarea */
	public hint = '';

	/** Error message (shows error state when set) */
	public error = '';

	/** Input size */
	public size: Size = 'md';

	/** Number of visible text lines */
	public rows = 3;

	/** Maximum character length */
	public maxLength = 0;

	/** Disable the textarea */
	public disabled = false;

	/** Make textarea readonly */
	public readonly = false;

	/** Mark as required */
	public required = false;

	/** Allow vertical resize */
	public resize = false;

	/** Internal focus state */
	public focused = false;

	public onInit(): void {
		if (!this.label && this.placeholder) {
			this.elementRef.setAttribute('aria-label', this.placeholder);
		}
	}

	public handleInput = (event: Event): void => {
		const target = event.target as HTMLTextAreaElement;
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
		const target = event.target as HTMLTextAreaElement;
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
