import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnRender } from '@melodicdev/core';
import type { ControlSize } from '../../../types/index.js';
import type { FormFieldOrientation } from './form-field.types.js';
import { formFieldTemplate } from './form-field.template.js';
import { formFieldStyles } from './form-field.styles.js';
import { setCrossRootDescription, getFocusableControl } from '../../../utils/accessibility/cross-root-aria.js';

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
		this._controlResolved = false;
		this.connectSlottedControl();
	};

	/** Cached slotted control — connectSlottedControl runs every render, so the
	 * slot scan + recursive control search must not. Invalidated on slotchange
	 * (and when the cached element leaves the DOM, e.g. a nested swap that
	 * doesn't re-assign the slot). */
	private _control: HTMLElement | null = null;
	private _controlResolved = false;

	private connectSlottedControl(): void {
		if (this._control && !this._control.isConnected) {
			this._controlResolved = false;
		}

		if (!this._controlResolved) {
			const slot = this.elementRef.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
			if (!slot) return;

			this._control = this.findFormControl(slot.assignedElements({ flatten: true }));
			this._controlResolved = true;
		}

		const control = this._control;
		if (!control) return;

		// Set ID if not present
		if (!control.id) {
			control.id = this.fieldId;
		}

		// The hint and error live in THIS component's shadow root while the
		// control is in the light DOM, so neither an `aria-describedby` IDREF
		// nor an element reference from the control can reach them (references
		// only resolve into the same or an ancestor tree). Their text is
		// carried on the control as `aria-description` instead.
		this.syncDescription(control);
		this.syncAttribute(control, 'aria-invalid', this.error ? 'true' : null);
		this.syncAttribute(control, 'aria-required', this.required ? 'true' : null);
		this.syncInnerControl(control);

		// Mirror the field's disabled state onto the control, in BOTH
		// directions — it used to be set to true and never cleared, so a field
		// that started disabled could never be re-enabled.
		if ('disabled' in control) {
			(control as HTMLInputElement).disabled = this.disabled;
		} else {
			this.syncAttribute(control, 'aria-disabled', this.disabled ? 'true' : null);
		}
	}

	/** The rendered error/hint elements that describe the control. */
	private getDescribers(): HTMLElement[] {
		const root = this.elementRef.shadowRoot;
		return [this.error ? root?.getElementById(this.errorId) : null, this.hint ? root?.getElementById(this.hintId) : null].filter(
			(element): element is HTMLElement => element !== null && element !== undefined
		);
	}

	/** Describe the control with the hint/error across the shadow boundary. */
	private syncDescription(control: HTMLElement): void {
		setCrossRootDescription(control, this.getDescribers());
	}

	/** ARIA attributes this field has put on a nested (shadow) control. */
	private readonly _innerOwned = new Set<string>();
	private _innerControl: HTMLElement | null = null;

	/**
	 * Mirror the field's ARIA state onto the element that actually takes
	 * focus. For a slotted `<ml-input>` / `<ml-select>` that is a control
	 * inside the component's own shadow root; ARIA on the host element alone
	 * is not announced when focus is on the inner control.
	 *
	 * The inner control belongs to another component, which may manage the
	 * same attributes itself — so only ever add our state, and only remove
	 * what we added.
	 */
	private syncInnerControl(control: HTMLElement): void {
		const inner = getFocusableControl(control);
		const target = inner !== control ? inner : null;

		if (this._innerControl && this._innerControl !== target) {
			for (const name of this._innerOwned) {
				this._innerControl.removeAttribute(name);
			}
			this._innerOwned.clear();
		}
		this._innerControl = target;

		if (!target) {
			return;
		}

		const description = this.getDescribers()
			.map((element) => element.textContent?.replace(/\s+/g, ' ').trim() ?? '')
			.filter(Boolean)
			.join('. ');

		this.syncOwnedAttribute(target, 'aria-description', description || null);
		this.syncOwnedAttribute(target, 'aria-invalid', this.error ? 'true' : null);
		this.syncOwnedAttribute(target, 'aria-required', this.required ? 'true' : null);
	}

	private syncOwnedAttribute(target: HTMLElement, name: string, value: string | null): void {
		if (value !== null) {
			if (target.getAttribute(name) !== value) {
				target.setAttribute(name, value);
			}
			this._innerOwned.add(name);
		} else if (this._innerOwned.has(name)) {
			target.removeAttribute(name);
			this._innerOwned.delete(name);
		}
	}

	/**
	 * Focus the slotted control when the label is clicked. `<label for=…>` can
	 * only target an element in the same tree, so the label's `for` never
	 * resolved to the light-DOM control.
	 */
	public handleLabelClick = (event: Event): void => {
		event.preventDefault();
		this._control?.focus();
	};

	private syncAttribute(el: HTMLElement, name: string, value: string | null): void {
		if (value === null) {
			el.removeAttribute(name);
		} else if (el.getAttribute(name) !== value) {
			el.setAttribute(name, value);
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
