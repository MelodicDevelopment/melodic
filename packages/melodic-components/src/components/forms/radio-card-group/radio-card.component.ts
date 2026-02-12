import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { radioCardTemplate } from './radio-card.template.js';
import { radioCardStyles } from './radio-card.styles.js';

/**
 * ml-radio-card - A card-style radio option for use within ml-radio-card-group
 *
 * @example
 * ```html
 * <ml-radio-card value="basic" label="Basic plan" description="Up to 5 users" detail="$10/mo" icon="user"></ml-radio-card>
 * ```
 *
 * @slot default - Additional content below label/description
 */
@MelodicComponent({
	selector: 'ml-radio-card',
	template: radioCardTemplate,
	styles: radioCardStyles,
	attributes: ['value', 'label', 'description', 'detail', 'icon', 'selected', 'disabled', 'group-disabled']
})
export class RadioCardComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Card value identifier */
	value = '';

	/** Primary label */
	label = '';

	/** Description text below label */
	description = '';

	/** Secondary detail text (e.g. price), shown on the right */
	detail = '';

	/** Optional icon name */
	icon = '';

	/** Selected state (managed by parent via attribute) */
	selected = false;

	/** Disabled state on this card */
	disabled = false;

	/** Disabled state from parent group */
	groupDisabled = false;

	get isDisabled(): boolean {
		return this.disabled || this.groupDisabled;
	}

	handleClick = (): void => {
		if (this.isDisabled) return;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:card-select', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};
}
