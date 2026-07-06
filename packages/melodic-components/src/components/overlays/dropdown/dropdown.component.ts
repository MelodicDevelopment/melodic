import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import type { Placement } from '../../../types/index.js';
import type { DropdownItemComponent } from './dropdown-item.component.js';
import { OverlayPositioner, ToggleDismissGuard } from '../../../utils/overlay/index.js';
import { isDeepFocusWithin } from '../../../utils/accessibility/focus-trap.js';
import { dropdownTemplate } from './dropdown.template.js';
import { dropdownStyles } from './dropdown.styles.js';

type DropdownItemElement = HTMLElement & DropdownItemComponent;

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
	public elementRef!: HTMLElement;

	/** Menu placement relative to trigger */
	public placement: Placement = 'bottom-start';

	/** Gap between trigger and menu in px */
	public offset = 4;

	/** Show arrow pointing to trigger */
	public arrow = false;

	/** Current open state */
	public isOpen = false;

	private _focusedIndex = -1;
	private readonly _positioner = new OverlayPositioner(() => ({
		placement: this.placement,
		offset: this.offset,
		arrowElement: this.arrow ? (this.elementRef.shadowRoot?.querySelector('.ml-dropdown__arrow') as HTMLElement | null) : null,
		placementAttribute: true
	}));
	// Swallows the trigger click that just light-dismissed the open menu so it
	// doesn't immediately reopen it.
	private readonly _dismissGuard = new ToggleDismissGuard();
	// Set by keyboard-initiated closes (Escape/Tab/Enter selection) so focus is
	// returned to the trigger only for keyboard or inside-overlay dismissals —
	// never yanked away from an element the user just clicked outside the menu.
	private _restoreFocusOnClose = false;

	public onCreate(): void {
		const menuEl = this.getMenuEl();
		if (menuEl) {
			menuEl.addEventListener('toggle', this.handleToggle);
		}

		this.elementRef.addEventListener('ml:item-select', this.handleItemSelect as EventListener);
		this.elementRef.addEventListener('keydown', this.handleKeyDown);
		this.elementRef.shadowRoot?.addEventListener('slotchange', this.syncTriggerAria);
		this.syncTriggerAria();
	}

	public onDestroy(): void {
		this._positioner.stop();
		const menuEl = this.getMenuEl();
		if (menuEl) {
			menuEl.removeEventListener('toggle', this.handleToggle);
		}
		this.elementRef.removeEventListener('ml:item-select', this.handleItemSelect as EventListener);
		this.elementRef.removeEventListener('keydown', this.handleKeyDown);
		this.elementRef.shadowRoot?.removeEventListener('slotchange', this.syncTriggerAria);
	}

	/** Open the menu */
	public open(): void {
		const menuEl = this.getMenuEl();
		if (menuEl && !this.isOpen) {
			menuEl.showPopover();
		}
	}

	/** Close the menu */
	public close(): void {
		const menuEl = this.getMenuEl();
		if (menuEl && this.isOpen) {
			menuEl.hidePopover();
		}
	}

	/** Toggle the menu */
	public toggle = (): void => {
		// A click on the trigger that just light-dismissed the open menu would
		// otherwise reopen it. Swallow that one toggle.
		if (this._dismissGuard.shouldSkipToggle()) {
			return;
		}
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
			// Guard the immediately-following trigger click (if this dismiss was
			// caused by clicking the trigger).
			this._dismissGuard.dismissed();
			// Restore trigger focus only for keyboard dismissals or when focus is
			// still inside the dropdown (e.g. an item was clicked). A pointer
			// light-dismiss that moved focus elsewhere must not steal it back.
			const shouldRestoreFocus = this._restoreFocusOnClose || isDeepFocusWithin(this.elementRef);
			this._restoreFocusOnClose = false;
			this.clearFocus();
			this._positioner.stop();
			if (shouldRestoreFocus) {
				this.returnFocusToTrigger();
			}
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:close', { bubbles: true, composed: true })
			);
		}
		this.syncTriggerAria();
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
						this._restoreFocusOnClose = true;
						// Methods aren't reflected on the host element; fall back to
						// the component instance when needed.
						const instance = (item as unknown as { component?: DropdownItemComponent }).component ?? item;
						instance.handleClick();
					}
				}
				break;

			case 'Escape':
				event.preventDefault();
				this._restoreFocusOnClose = true;
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

	private getNavigableItems(): DropdownItemElement[] {
		const slot = this.elementRef.shadowRoot?.querySelector('.ml-dropdown__menu slot:not([name])') as HTMLSlotElement | null;
		if (!slot) return [];

		const items: DropdownItemElement[] = [];
		const assigned = slot.assignedElements();

		for (const el of assigned) {
			if (el.tagName === 'ML-DROPDOWN-ITEM') {
				items.push(el as unknown as DropdownItemElement);
			} else if (el.tagName === 'ML-DROPDOWN-GROUP') {
				const groupSlot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
				if (groupSlot) {
					for (const child of groupSlot.assignedElements()) {
						if (child.tagName === 'ML-DROPDOWN-ITEM') {
							items.push(child as unknown as DropdownItemElement);
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

	private focusNextItem(items: DropdownItemElement[]): void {
		let index = this._focusedIndex + 1;
		while (index < items.length) {
			if (!items[index].disabled) {
				this.focusItemAtIndex(items, index);
				return;
			}
			index++;
		}
	}

	private focusPreviousItem(items: DropdownItemElement[]): void {
		let index = this._focusedIndex - 1;
		while (index >= 0) {
			if (!items[index].disabled) {
				this.focusItemAtIndex(items, index);
				return;
			}
			index--;
		}
	}

	private focusItemAtIndex(items: DropdownItemElement[], index: number): void {
		if (index < 0) return;

		for (let i = 0; i < items.length; i++) {
			items[i].focused = i === index;
		}
		this._focusedIndex = index;

		// The item host lives in the same tree as the trigger, so its id is a
		// valid aria-activedescendant reference for screen readers.
		const itemID = items[index].id;
		if (itemID) {
			this.getAssignedTrigger()?.setAttribute('aria-activedescendant', itemID);
		}
	}

	private clearFocus(): void {
		const items = this.getNavigableItems();
		for (const item of items) {
			item.focused = false;
		}
		this._focusedIndex = -1;
		this.getAssignedTrigger()?.removeAttribute('aria-activedescendant');
	}

	private findFirstEnabled(items: DropdownItemElement[]): number {
		return items.findIndex((item) => !item.disabled);
	}

	private findLastEnabled(items: DropdownItemElement[]): number {
		for (let i = items.length - 1; i >= 0; i--) {
			if (!items[i].disabled) return i;
		}
		return -1;
	}

	private returnFocusToTrigger(): void {
		this.getAssignedTrigger()?.focus();
	}

	/** First element assigned to the trigger slot (light DOM). */
	private getAssignedTrigger(): HTMLElement | null {
		const triggerSlot = this.elementRef.shadowRoot?.querySelector('slot[name="trigger"]') as HTMLSlotElement | null;
		const assigned = triggerSlot?.assignedElements() ?? [];
		return (assigned[0] as HTMLElement) ?? null;
	}

	/** Keep the slotted trigger's menu-button ARIA in sync with open state. */
	private readonly syncTriggerAria = (): void => {
		const trigger = this.getAssignedTrigger();
		if (!trigger) return;
		trigger.setAttribute('aria-haspopup', 'menu');
		trigger.setAttribute('aria-expanded', String(this.isOpen));
	};

	/** True when the (deep) focused element is inside this dropdown. */
	private startPositioning(): void {
		const triggerEl = this.getTriggerEl();
		const menuEl = this.getMenuEl();

		if (!triggerEl || !menuEl) return;

		this._positioner.start(triggerEl, menuEl);
	}

	private getTriggerEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-dropdown__trigger') as HTMLElement | null;
	}

	private getMenuEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-dropdown__menu') as HTMLElement | null;
	}
}
