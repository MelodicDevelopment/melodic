import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { dropdownItemTemplate } from './dropdown-item.template.js';
import { dropdownItemStyles } from './dropdown-item.styles.js';

/**
 * ml-dropdown-item - Individual menu item within a dropdown
 *
 * @example
 * ```html
 * <ml-dropdown-item value="edit" icon="pencil">Edit</ml-dropdown-item>
 * <ml-dropdown-item value="delete" icon="trash" destructive>Delete</ml-dropdown-item>
 * ```
 *
 * @slot default - The item label text
 * @fires ml:item-select - Internal event caught by parent dropdown
 */
@MelodicComponent({
	selector: 'ml-dropdown-item',
	template: dropdownItemTemplate,
	styles: dropdownItemStyles,
	attributes: ['value', 'icon', 'addon', 'disabled', 'destructive']
})
export class DropdownItemComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Selection value emitted on click */
	value = '';

	/** Left icon name (Phosphor) */
	icon = '';

	/** Right addon text (e.g. keyboard shortcut) */
	addon = '';

	/** Non-interactive state */
	disabled = false;

	/** Red/danger styling */
	destructive = false;

	/** Set by parent dropdown for keyboard navigation highlight */
	focused = false;

	handleClick = (): void => {
		if (this.disabled) return;

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:item-select', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};
}
