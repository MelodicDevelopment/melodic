import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { buttonGroupItemTemplate } from './button-group-item.template.js';
import { buttonGroupItemStyles } from './button-group-item.styles.js';

/**
 * ml-button-group-item - Individual item within a button group
 *
 * @example
 * ```html
 * <ml-button-group-item value="list" icon="list">List View</ml-button-group-item>
 * ```
 *
 * @slot default - Button label content
 */
@MelodicComponent({
	selector: 'ml-button-group-item',
	template: buttonGroupItemTemplate,
	styles: buttonGroupItemStyles,
	attributes: ['value', 'icon', 'disabled', 'active', 'group-disabled', 'group-size']
})
export class ButtonGroupItemComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Item value identifier */
	value = '';

	/** Optional icon name */
	icon = '';

	/** Disable this item */
	disabled = false;

	/** Active state (managed by parent via attribute) */
	active = false;

	/** Disabled state from parent group */
	groupDisabled = false;

	/** Size from parent group */
	groupSize: Size = 'md';

	get isDisabled(): boolean {
		return this.disabled || this.groupDisabled;
	}

	handleClick = (): void => {
		if (this.isDisabled) return;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:item-click', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};
}
