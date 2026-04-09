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
	attributes: ['variant', 'size', 'type', 'disabled', 'loading', 'full-width', 'href', 'target', 'rel', 'download']
})
export class ButtonComponent implements IElementRef, OnInit {
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

	public onInit(): void {
		// Ensure proper ARIA role
		if (!this.elementRef.hasAttribute('role')) {
			this.elementRef.setAttribute('role', 'button');
		}
	}

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
	};
}
