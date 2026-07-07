import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnRender } from '@melodicdev/core';
import { newID } from '../../../functions/new-id.function.js';
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
export class DropdownItemComponent implements IElementRef, OnCreate, OnRender {
	public elementRef!: HTMLElement;

	/** Selection value emitted on click */
	public value = '';

	/** Left icon name (Phosphor) */
	public icon = '';

	/** Right addon text (e.g. keyboard shortcut) */
	public addon = '';

	/** Non-interactive state */
	public disabled = false;

	/** Red/danger styling */
	public destructive = false;

	/** Set by parent dropdown for keyboard navigation highlight */
	public focused = false;

	public onCreate(): void {
		// The host carries the menuitem semantics: it lives in the same (light
		// DOM) tree as the dropdown trigger, so its id is a valid
		// aria-activedescendant reference for the trigger.
		if (!this.elementRef.id) {
			this.elementRef.id = newID();
		}
		this.elementRef.setAttribute('role', 'menuitem');
		this.elementRef.setAttribute('tabindex', '-1');
		this.syncHostAria();
	}

	public onRender(): void {
		this.syncHostAria();
	}

	private syncHostAria(): void {
		this.elementRef.setAttribute('aria-disabled', String(this.disabled));
	}

	public handleClick = (): void => {
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
