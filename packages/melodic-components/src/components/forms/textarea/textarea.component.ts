import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { textareaTemplate } from './textarea.template.js';
import { textareaStyles } from './textarea.styles.js';

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
 * @fires ml-input - Emitted on input
 * @fires ml-change - Emitted on change (blur)
 * @fires ml-focus - Emitted on focus
 * @fires ml-blur - Emitted on blur
 */
@MelodicComponent({
	selector: 'ml-textarea',
	template: textareaTemplate,
	styles: textareaStyles,
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'rows', 'max-length', 'disabled', 'readonly', 'required', 'resize']
})
export class TextareaComponent implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	/** Current value */
	value = '';

	/** Placeholder text */
	placeholder = '';

	/** Label text */
	label = '';

	/** Hint text shown below textarea */
	hint = '';

	/** Error message (shows error state when set) */
	error = '';

	/** Input size */
	size: Size = 'md';

	/** Number of visible text lines */
	rows = 3;

	/** Maximum character length */
	maxLength = 0;

	/** Disable the textarea */
	disabled = false;

	/** Make textarea readonly */
	readonly = false;

	/** Mark as required */
	required = false;

	/** Allow vertical resize */
	resize = false;

	/** Internal focus state */
	_focused = false;

	onInit(): void {
		if (!this.label && this.placeholder) {
			this.elementRef.setAttribute('aria-label', this.placeholder);
		}
	}

	handleInput = (event: Event): void => {
		const target = event.target as HTMLTextAreaElement;
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
		const target = event.target as HTMLTextAreaElement;
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
