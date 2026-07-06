import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnRender } from '@melodicdev/core';
import type { ControlSize } from '../../../types/index.js';
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
export class FormFieldComponent implements IElementRef, OnCreate, OnRender {
	public elementRef!: HTMLElement;

	/** Label text */
	public label = '';

	/** Hint text shown below the control */
	public hint = '';

	/** Error message (shows error state when set) */
	public error = '';

	/** Field size */
	public size: ControlSize = 'md';

	/** Layout orientation */
	public orientation: FormFieldOrientation = 'vertical';

	/** Disabled state */
	public disabled = false;

	/** Required field indicator */
	public required = false;

	/** Unique ID for connecting label to control */
	private readonly _fieldId = `ml-form-field-${Math.random().toString(36).slice(2, 9)}`;

	public get fieldId(): string {
		return this._fieldId;
	}

	public get hintId(): string {
		return `${this._fieldId}-hint`;
	}

	public get errorId(): string {
		return `${this._fieldId}-error`;
	}

	public get describedBy(): string {
		// Both the error and the hint describe the control when both are present.
		const ids: string[] = [];
		if (this.error) ids.push(this.errorId);
		if (this.hint) ids.push(this.hintId);
		return ids.join(' ');
	}

	public onCreate(): void {
		this.connectSlottedControl();
	}

	public onRender(): void {
		// Re-sync ARIA after every render so reactive changes to error/hint/
		// required (e.g. validation errors set after submit) reach the slotted
		// control — and are removed again when the error clears.
		this.connectSlottedControl();
	}

	public handleSlotChange = (): void => {
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

			// Connect aria-describedby for hint/error; remove when neither is set
			if (this.describedBy) {
				control.setAttribute('aria-describedby', this.describedBy);
			} else {
				control.removeAttribute('aria-describedby');
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
			} else {
				control.removeAttribute('aria-required');
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
