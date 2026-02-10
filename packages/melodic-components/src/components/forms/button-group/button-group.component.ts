import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { buttonGroupTemplate } from './button-group.template.js';
import { buttonGroupStyles } from './button-group.styles.js';

/**
 * ml-button-group - A group of connected toggle buttons
 *
 * @example Single selection:
 * ```html
 * <ml-button-group value="list">
 *   <ml-button-group-item value="list" icon="list">List</ml-button-group-item>
 *   <ml-button-group-item value="grid" icon="grid-four">Grid</ml-button-group-item>
 * </ml-button-group>
 * ```
 *
 * @example Multiple selection:
 * ```html
 * <ml-button-group multiple>
 *   <ml-button-group-item value="bold" icon="text-bolder"></ml-button-group-item>
 *   <ml-button-group-item value="italic" icon="text-italic"></ml-button-group-item>
 *   <ml-button-group-item value="underline" icon="text-underline"></ml-button-group-item>
 * </ml-button-group>
 * ```
 *
 * @fires ml:change - Emitted when selection changes. Detail: { value: string } or { values: string[] }
 */
@MelodicComponent({
	selector: 'ml-button-group',
	template: buttonGroupTemplate,
	styles: buttonGroupStyles,
	attributes: ['value', 'variant', 'size', 'disabled', 'multiple']
})
export class ButtonGroupComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Currently selected value (single selection mode) */
	value = '';

	/** Active state style: 'outline' (gray) or 'solid' (primary color) */
	variant: 'outline' | 'solid' = 'outline';

	/** Size variant */
	size: Size = 'md';

	/** Disable the entire group */
	disabled = false;

	/** Allow multiple selections */
	multiple = false;

	/** Selected values (multiple mode) */
	values: string[] = [];

	onCreate(): void {
		this.elementRef.addEventListener('ml:item-click', this._handleItemClick as EventListener);
		this.syncItems();
	}

	onDestroy(): void {
		this.elementRef.removeEventListener('ml:item-click', this._handleItemClick as EventListener);
	}

	/** Handle slot changes to sync initial state */
	handleSlotChange = (): void => {
		this.syncItems();
	};

	private readonly _handleItemClick = (event: CustomEvent<{ value: string }>): void => {
		event.stopPropagation();
		const itemValue = event.detail.value;

		if (this.multiple) {
			const idx = this.values.indexOf(itemValue);
			if (idx >= 0) {
				this.values = this.values.filter((v) => v !== itemValue);
			} else {
				this.values = [...this.values, itemValue];
			}
			this.syncItems();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:change', {
					bubbles: true,
					composed: true,
					detail: { values: this.values }
				})
			);
		} else {
			this.value = itemValue;
			this.syncItems();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:change', {
					bubbles: true,
					composed: true,
					detail: { value: this.value }
				})
			);
		}
	};

	private syncItems(): void {
		const items = this.elementRef.querySelectorAll('ml-button-group-item');
		items.forEach((item) => {
			const itemValue = item.getAttribute('value') ?? '';
			const isActive = this.multiple ? this.values.includes(itemValue) : itemValue === this.value;

			item.toggleAttribute('active', isActive);
			item.toggleAttribute('group-disabled', this.disabled);
			item.setAttribute('group-size', this.size);
			item.setAttribute('group-variant', this.variant);
		});
	}
}
