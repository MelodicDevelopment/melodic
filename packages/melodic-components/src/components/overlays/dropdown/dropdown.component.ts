import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Placement } from '../../../types/index.js';
import type { DropdownItemComponent } from './dropdown-item.component.js';
import { computePosition, autoUpdate, offset, flip, shift, arrow as arrowMiddleware } from '../../../utils/positioning/index.js';
import { dropdownTemplate } from './dropdown.template.js';
import { dropdownStyles } from './dropdown.styles.js';

/**
 * ml-dropdown - Dropdown menu component
 *
 * @example
 * ```html
 * <ml-dropdown>
 *   <ml-button slot="trigger">Options</ml-button>
 *   <ml-dropdown-item value="edit" icon="pencil">Edit</ml-dropdown-item>
 *   <ml-dropdown-item value="delete" icon="trash" destructive>Delete</ml-dropdown-item>
 * </ml-dropdown>
 * ```
 *
 * @slot trigger - The element that toggles the dropdown
 * @slot default - Menu items, groups, and separators
 * @fires ml:select - Emitted when an item is selected, detail: { value }
 * @fires ml:open - Emitted when the menu opens
 * @fires ml:close - Emitted when the menu closes
 */
@MelodicComponent({
	selector: 'ml-dropdown',
	template: dropdownTemplate,
	styles: dropdownStyles,
	attributes: ['placement', 'offset', 'arrow']
})
export class DropdownComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Menu placement relative to trigger */
	placement: Placement = 'bottom-start';

	/** Gap between trigger and menu in px */
	offset = 4;

	/** Show arrow pointing to trigger */
	arrow = false;

	/** Current open state */
	isOpen = false;

	private _focusedIndex = -1;
	private _cleanupAutoUpdate: (() => void) | null = null;

	onCreate(): void {
		const menuEl = this.getMenuEl();
		if (menuEl) {
			menuEl.addEventListener('toggle', this.handleToggle);
		}

		this.elementRef.addEventListener('ml:item-select', this.handleItemSelect as EventListener);
		this.elementRef.addEventListener('keydown', this.handleKeyDown);
	}

	onDestroy(): void {
		this._cleanupAutoUpdate?.();
		const menuEl = this.getMenuEl();
		if (menuEl) {
			menuEl.removeEventListener('toggle', this.handleToggle);
		}
		this.elementRef.removeEventListener('ml:item-select', this.handleItemSelect as EventListener);
		this.elementRef.removeEventListener('keydown', this.handleKeyDown);
	}

	/** Open the menu */
	open(): void {
		const menuEl = this.getMenuEl();
		if (menuEl && !this.isOpen) {
			menuEl.showPopover();
		}
	}

	/** Close the menu */
	close(): void {
		const menuEl = this.getMenuEl();
		if (menuEl && this.isOpen) {
			menuEl.hidePopover();
		}
	}

	/** Toggle the menu */
	toggle = (): void => {
		const menuEl = this.getMenuEl();
		if (menuEl) {
			menuEl.togglePopover();
		}
	};

	private readonly handleToggle = (event: Event): void => {
		const toggleEvent = event as ToggleEvent;
		if (toggleEvent.newState === 'open') {
			this.isOpen = true;
			this.startPositioning();
			this.focusFirstItem();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:open', { bubbles: true, composed: true })
			);
		} else {
			this.isOpen = false;
			this.clearFocus();
			this._cleanupAutoUpdate?.();
			this._cleanupAutoUpdate = null;
			this.returnFocusToTrigger();
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:close', { bubbles: true, composed: true })
			);
		}
	};

	private readonly handleItemSelect = (event: CustomEvent): void => {
		event.stopPropagation();
		const { value } = event.detail;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:select', {
				bubbles: true,
				composed: true,
				detail: { value }
			})
		);
		this.close();
	};

	private readonly handleKeyDown = (event: KeyboardEvent): void => {
		if (!this.isOpen) {
			if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.open();
			}
			return;
		}

		const items = this.getNavigableItems();
		if (!items.length) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				this.focusNextItem(items);
				break;

			case 'ArrowUp':
				event.preventDefault();
				this.focusPreviousItem(items);
				break;

			case 'Enter':
			case ' ':
				event.preventDefault();
				if (this._focusedIndex >= 0 && this._focusedIndex < items.length) {
					const item = items[this._focusedIndex];
					if (!item.disabled) {
						item.handleClick();
					}
				}
				break;

			case 'Escape':
				event.preventDefault();
				this.close();
				break;

			case 'Tab':
				this.close();
				break;

			case 'Home':
				event.preventDefault();
				this.focusItemAtIndex(items, this.findFirstEnabled(items));
				break;

			case 'End':
				event.preventDefault();
				this.focusItemAtIndex(items, this.findLastEnabled(items));
				break;

			default:
				break;
		}
	};

	private getNavigableItems(): DropdownItemComponent[] {
		const slot = this.elementRef.shadowRoot?.querySelector('.ml-dropdown__menu slot:not([name])') as HTMLSlotElement | null;
		if (!slot) return [];

		const items: DropdownItemComponent[] = [];
		const assigned = slot.assignedElements();

		for (const el of assigned) {
			if (el.tagName === 'ML-DROPDOWN-ITEM') {
				items.push(el as unknown as DropdownItemComponent);
			} else if (el.tagName === 'ML-DROPDOWN-GROUP') {
				const groupSlot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
				if (groupSlot) {
					for (const child of groupSlot.assignedElements()) {
						if (child.tagName === 'ML-DROPDOWN-ITEM') {
							items.push(child as unknown as DropdownItemComponent);
						}
					}
				}
			}
		}

		return items;
	}

	private focusFirstItem(): void {
		const items = this.getNavigableItems();
		const index = this.findFirstEnabled(items);
		this.focusItemAtIndex(items, index);
	}

	private focusNextItem(items: DropdownItemComponent[]): void {
		let index = this._focusedIndex + 1;
		while (index < items.length) {
			if (!items[index].disabled) {
				this.focusItemAtIndex(items, index);
				return;
			}
			index++;
		}
	}

	private focusPreviousItem(items: DropdownItemComponent[]): void {
		let index = this._focusedIndex - 1;
		while (index >= 0) {
			if (!items[index].disabled) {
				this.focusItemAtIndex(items, index);
				return;
			}
			index--;
		}
	}

	private focusItemAtIndex(items: DropdownItemComponent[], index: number): void {
		if (index < 0) return;

		for (let i = 0; i < items.length; i++) {
			items[i].focused = i === index;
		}
		this._focusedIndex = index;
	}

	private clearFocus(): void {
		const items = this.getNavigableItems();
		for (const item of items) {
			item.focused = false;
		}
		this._focusedIndex = -1;
	}

	private findFirstEnabled(items: DropdownItemComponent[]): number {
		return items.findIndex((item) => !item.disabled);
	}

	private findLastEnabled(items: DropdownItemComponent[]): number {
		for (let i = items.length - 1; i >= 0; i--) {
			if (!items[i].disabled) return i;
		}
		return -1;
	}

	private returnFocusToTrigger(): void {
		const triggerSlot = this.elementRef.shadowRoot?.querySelector('slot[name="trigger"]') as HTMLSlotElement | null;
		if (triggerSlot) {
			const assigned = triggerSlot.assignedElements();
			if (assigned.length > 0) {
				(assigned[0] as HTMLElement).focus();
			}
		}
	}

	private startPositioning(): void {
		const triggerEl = this.getTriggerEl();
		const menuEl = this.getMenuEl();

		if (!triggerEl || !menuEl) return;

		const update = () => this.updatePosition(triggerEl, menuEl);

		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = autoUpdate(triggerEl, menuEl, update);
	}

	private updatePosition(triggerEl: HTMLElement, menuEl: HTMLElement): void {
		const arrowEl = this.arrow ? (this.elementRef.shadowRoot?.querySelector('.ml-dropdown__arrow') as HTMLElement) : null;

		const middleware = [offset(this.offset), flip(), shift({ padding: 8 })];

		if (arrowEl) {
			middleware.push(arrowMiddleware({ element: arrowEl, padding: 8 }));
		}

		const { x, y, placement, middlewareData } = computePosition(triggerEl, menuEl, {
			placement: this.placement,
			middleware
		});

		menuEl.style.left = `${x}px`;
		menuEl.style.top = `${y}px`;
		menuEl.dataset.placement = placement;

		if (arrowEl && middlewareData.arrow) {
			this.positionArrow(arrowEl, placement, middlewareData.arrow as { x?: number; y?: number });
		}
	}

	private positionArrow(arrowEl: HTMLElement, placement: string, arrowData: { x?: number; y?: number }): void {
		const side = placement.split('-')[0];

		arrowEl.style.left = arrowData.x === undefined ? '' : `${arrowData.x}px`;
		arrowEl.style.right = '';
		arrowEl.style.top = arrowData.y === undefined ? '' : `${arrowData.y}px`;
		arrowEl.style.bottom = '';

		if (side === 'top') {
			arrowEl.style.bottom = '-4px';
		}
		if (side === 'bottom') {
			arrowEl.style.top = '-4px';
		}
		if (side === 'left') {
			arrowEl.style.right = '-4px';
		}
		if (side === 'right') {
			arrowEl.style.left = '-4px';
		}
	}

	private getTriggerEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-dropdown__trigger') as HTMLElement | null;
	}

	private getMenuEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-dropdown__menu') as HTMLElement | null;
	}
}
