import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { computePosition, autoUpdate, offset, flip, shift } from '../../../utils/positioning/index.js';
import { datePickerTemplate } from './date-picker.template.js';
import { datePickerStyles } from './date-picker.styles.js';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDisplay(iso: string): string {
	if (!iso) return '';
	const parts = iso.split('-');
	if (parts.length !== 3) return iso;
	const month = parseInt(parts[1], 10) - 1;
	const day = parseInt(parts[2], 10);
	const year = parseInt(parts[0], 10);
	return `${MONTH_SHORT[month]} ${day}, ${year}`;
}

/**
 * ml-date-picker - Date input with calendar dropdown
 *
 * @example
 * ```html
 * <ml-date-picker label="Start date" value="2026-02-08"></ml-date-picker>
 * <ml-date-picker placeholder="Select date" min="2026-01-01" max="2026-12-31"></ml-date-picker>
 * ```
 *
 * @fires ml:change - Emitted when a date is selected. Detail: { value: string }
 */
@MelodicComponent({
	selector: 'ml-date-picker',
	template: datePickerTemplate,
	styles: datePickerStyles,
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'required', 'min', 'max']
})
export class DatePickerComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Selected date in ISO format (YYYY-MM-DD) */
	value = '';

	/** Placeholder text */
	placeholder = 'Select date';

	/** Field label */
	label = '';

	/** Hint text */
	hint = '';

	/** Error message */
	error = '';

	/** Input size */
	size: 'sm' | 'md' | 'lg' = 'md';

	/** Disabled state */
	disabled = false;

	/** Required state */
	required = false;

	/** Minimum selectable date (YYYY-MM-DD) */
	min = '';

	/** Maximum selectable date (YYYY-MM-DD) */
	max = '';

	/** Whether the calendar popover is open */
	isOpen = false;

	private _cleanupAutoUpdate: (() => void) | null = null;

	get displayValue(): string {
		return formatDisplay(this.value);
	}

	onCreate(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.addEventListener('toggle', this._handleToggle);
		}
	}

	onDestroy(): void {
		this._cleanupAutoUpdate?.();
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.removeEventListener('toggle', this._handleToggle);
		}
	}

	toggleCalendar = (): void => {
		if (this.disabled) return;
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.togglePopover();
		}
	};

	/** Called when a day is clicked - selects immediately and closes */
	handleDateSelect = (event: Event): void => {
		event.stopPropagation();
		const detail = (event as CustomEvent).detail as { value: string };
		this.commitValue(detail.value);
		this.closePopover();
	};

	handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape' && this.isOpen) {
			event.preventDefault();
			this.closePopover();
		} else if ((event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') && !this.isOpen) {
			event.preventDefault();
			this.toggleCalendar();
		}
	};

	private commitValue(iso: string): void {
		this.value = iso;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: iso }
			})
		);
	}

	private readonly _handleToggle = (event: Event): void => {
		const toggleEvent = event as ToggleEvent;
		if (toggleEvent.newState === 'open') {
			this.isOpen = true;
			this.startPositioning();
		} else {
			this.isOpen = false;
			this._cleanupAutoUpdate?.();
			this._cleanupAutoUpdate = null;
			this.returnFocus();
		}
	};

	private closePopover(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) {
			popoverEl.hidePopover();
		}
	}

	private startPositioning(): void {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();
		if (!triggerEl || !popoverEl) return;

		const update = () => this.updatePosition(triggerEl, popoverEl);
		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = autoUpdate(triggerEl, popoverEl, update);
	}

	private updatePosition(triggerEl: HTMLElement, popoverEl: HTMLElement): void {
		const middleware = [offset(4), flip(), shift({ padding: 8 })];
		const { x, y } = computePosition(triggerEl, popoverEl, {
			placement: 'bottom-start',
			middleware
		});
		popoverEl.style.left = `${x}px`;
		popoverEl.style.top = `${y}px`;
	}

	private returnFocus(): void {
		const triggerEl = this.getTriggerEl();
		if (triggerEl) {
			triggerEl.focus();
		}
	}

	private getTriggerEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-date-picker__trigger') as HTMLElement | null;
	}

	private getPopoverEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-date-picker__popover') as HTMLElement | null;
	}
}
