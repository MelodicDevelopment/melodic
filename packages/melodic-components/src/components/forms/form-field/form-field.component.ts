import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { FormFieldOrientation } from './form-field.types.js';
import { formFieldTemplate } from './form-field.template.js';
import { formFieldStyles } from './form-field.styles.js';

/**
 * ml-form-field - Wrapper component that adds label, hint, and error to any form control
 *
 * @example
 * ```html
 * <ml-form-field label="Username" hint="Choose a unique username" required>
 *   <input type="text" />
 * </ml-form-field>
 *
 * <ml-form-field label="Email" error="Invalid email address">
 *   <input type="email" />
 * </ml-form-field>
 *
 * <ml-form-field label="Agree to terms" orientation="horizontal">
 *   <ml-checkbox></ml-checkbox>
 * </ml-form-field>
 * ```
 *
 * @slot default - The form control element
 */
@MelodicComponent({
	selector: 'ml-form-field',
	template: formFieldTemplate,
	styles: formFieldStyles,
	attributes: ['label', 'hint', 'error', 'size', 'orientation', 'disabled', 'required']
})
export class FormFieldComponent implements IElementRef, OnCreate {
	elementRef!: HTMLElement;

	/** Label text */
	label = '';

	/** Hint text shown below the control */
	hint = '';

	/** Error message (shows error state when set) */
	error = '';

	/** Field size */
	size: Size = 'md';

	/** Layout orientation */
	orientation: FormFieldOrientation = 'vertical';

	/** Disabled state */
	disabled = false;

	/** Required field indicator */
	required = false;

	/** Unique ID for connecting label to control */
	private readonly _fieldId = `ml-form-field-${Math.random().toString(36).slice(2, 9)}`;

	get fieldId(): string {
		return this._fieldId;
	}

	get hintId(): string {
		return `${this._fieldId}-hint`;
	}

	get errorId(): string {
		return `${this._fieldId}-error`;
	}

	get describedBy(): string {
		if (this.error) return this.errorId;
		if (this.hint) return this.hintId;
		return '';
	}

	onCreate(): void {
		this.connectSlottedControl();
	}

	handleSlotChange = (): void => {
		this.connectSlottedControl();
	};

	private connectSlottedControl(): void {
		const slot = this.elementRef.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
		if (!slot) return;

		const elements = slot.assignedElements({ flatten: true });
		const control = this.findFormControl(elements);

		if (control) {
			// Set ID if not present
			if (!control.id) {
				control.id = this.fieldId;
			}

			// Connect aria-describedby for hint/error
			if (this.describedBy) {
				control.setAttribute('aria-describedby', this.describedBy);
			}

			// Set aria-invalid for error state
			if (this.error) {
				control.setAttribute('aria-invalid', 'true');
			} else {
				control.removeAttribute('aria-invalid');
			}

			// Set aria-required
			if (this.required) {
				control.setAttribute('aria-required', 'true');
			}

			// Set disabled if applicable
			if (this.disabled && 'disabled' in control) {
				(control as HTMLInputElement).disabled = true;
			}
		}
	}

	private findFormControl(elements: Element[]): HTMLElement | null {
		for (const element of elements) {
			// Check if it's a native form control
			if (
				element instanceof HTMLInputElement ||
				element instanceof HTMLSelectElement ||
				element instanceof HTMLTextAreaElement
			) {
				return element;
			}

			// Check if it's a custom element form control (has role or is focusable)
			if (element instanceof HTMLElement) {
				const role = element.getAttribute('role');
				if (
					role === 'textbox' ||
					role === 'combobox' ||
					role === 'checkbox' ||
					role === 'radio' ||
					role === 'switch' ||
					role === 'slider'
				) {
					return element;
				}

				// Check for Melodic components
				if (element.tagName.toLowerCase().startsWith('ml-')) {
					return element;
				}
			}

			// Recursively check children
			const nested = this.findFormControl(Array.from(element.children));
			if (nested) return nested;
		}
		return null;
	}
}
