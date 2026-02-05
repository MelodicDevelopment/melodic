import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit } from '@melodicdev/core';
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
 */
@MelodicComponent({
	selector: 'ml-button',
	template: buttonTemplate,
	styles: buttonStyles,
	attributes: ['variant', 'size', 'type', 'disabled', 'loading', 'full-width']
})
export class ButtonComponent implements IElementRef, OnInit {
	elementRef!: HTMLElement;

	/** Button variant style */
	variant: ButtonVariant = 'primary';

	/** Button size */
	size: Size = 'md';

	/** HTML button type */
	type: ButtonType = 'button';

	/** Disable the button */
	disabled = false;

	/** Show loading state */
	loading = false;

	/** Make button full width */
	fullWidth = false;

	onInit(): void {
		// Ensure proper ARIA role
		if (!this.elementRef.hasAttribute('role')) {
			this.elementRef.setAttribute('role', 'button');
		}
	}

	/** Whether the button is effectively disabled */
	get isDisabled(): boolean {
		return this.disabled || this.loading;
	}

	/** Handle click events */
	handleClick = (event: MouseEvent): void => {
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
	};
}
