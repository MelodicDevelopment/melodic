import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { ButtonVariant, ButtonType } from './button.types.js';
// Import spinner so it's registered
import '../../feedback/spinner/spinner.component.js';
import { buttonTemplate } from './button.template.js';
import { buttonStyles } from './button.styles.js';

/**
 * ml-button - A versatile button component with multiple variants and sizes
 *
 * @example
 * ```html
 * <ml-button>Click me</ml-button>
 * <ml-button variant="secondary">Secondary</ml-button>
 * <ml-button variant="outline" size="lg">Large Outline</ml-button>
 * <ml-button loading>Loading...</ml-button>
 * <ml-button disabled>Disabled</ml-button>
 * ```
 *
 * @slot default - Button label content
 * @slot icon-start - Icon before the label
 * @slot icon-end - Icon after the label
 *
 * @fires ml:click - Emitted when button is clicked (not disabled/loading)
 *
 * Form participation: when `type="submit"` (or `type="reset"`) and the element
 * is placed inside a `<form>`, clicking it submits (or resets) that form. The
 * shadow-internal native button cannot associate with the outer form, and the
 * component decorator does not currently support define-time
 * `static formAssociated = true`, so ElementInternals' `.form` is unavailable;
 * the component feature-detects it and otherwise finds the form by walking the
 * ancestor tree (crossing shadow boundaries) and calls `form.requestSubmit()`.
 */
@MelodicComponent({
	selector: 'ml-button',
	template: buttonTemplate,
	styles: buttonStyles,
	attributes: ['variant', 'size', 'type', 'disabled', 'loading', 'full-width', 'href', 'target', 'rel', 'download']
})
export class ButtonComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Button variant style */
	public variant: ButtonVariant = 'primary';

	/** Button size */
	public size: Size = 'md';

	/** HTML button type */
	public type: ButtonType = 'button';

	/** Disable the button */
	public disabled = false;

	/** Show loading state */
	public loading = false;

	/** Make button full width */
	public fullWidth = false;

	/** If set, renders as an anchor tag instead of a button */
	public href: string | null = null;

	/** Anchor target (only used when href is set) */
	public target: string | null = null;

	/** Anchor rel (only used when href is set) */
	public rel: string | null = null;

	/** Anchor download (only used when href is set) */
	public download: string | null = null;

	private _internals: ElementInternals | null = null;
	private _internalsAttached = false;

	/** Whether the button is effectively disabled */
	public get isDisabled(): boolean {
		return this.disabled || this.loading;
	}

	/** Handle click events */
	public handleClick = (event: MouseEvent): void => {
		if (this.isDisabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}

		// Dispatch custom event
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:click', {
				bubbles: true,
				composed: true,
				detail: { originalEvent: event }
			})
		);

		// Mirror native button form behavior. Skip when the consumer prevented
		// the click's default action (matches native submit-button semantics).
		if (this.href == null && !event.defaultPrevented) {
			if (this.type === 'submit') {
				this.submitForm();
			} else if (this.type === 'reset') {
				this.findForm()?.reset();
			}
		}
	};

	private submitForm(): void {
		const form = this.findForm();
		if (!form) return;

		if (typeof form.requestSubmit === 'function') {
			form.requestSubmit();
		} else {
			// Very old environments: submit without constraint validation
			form.submit();
		}
	}

	/**
	 * Find the owning form. Prefers ElementInternals (`internals.form`), which
	 * only works if the custom element was defined with
	 * `static formAssociated = true` — the component decorator does not expose
	 * that yet, so this typically falls through to walking the ancestor tree
	 * (crossing shadow boundaries).
	 */
	private findForm(): HTMLFormElement | null {
		const viaInternals = this.getInternalsForm();
		if (viaInternals) return viaInternals;

		let el: Element | null = this.elementRef;
		while (el) {
			const form = el.closest('form');
			if (form) return form;
			const root = el.getRootNode();
			el = root instanceof ShadowRoot ? root.host : null;
		}
		return null;
	}

	private getInternalsForm(): HTMLFormElement | null {
		if (this._internals === null && !this._internalsAttached) {
			this._internalsAttached = true;
			try {
				if (typeof this.elementRef.attachInternals === 'function') {
					this._internals = this.elementRef.attachInternals();
				}
			} catch {
				this._internals = null;
			}
		}

		try {
			// Throws NotSupportedError when the element is not form-associated
			return this._internals?.form ?? null;
		} catch {
			return null;
		}
	}
}
