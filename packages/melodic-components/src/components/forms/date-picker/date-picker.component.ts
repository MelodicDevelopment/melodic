import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { computePosition, autoUpdate, offset, flip, shift } from '../../../utils/positioning/index.js';
import { datePickerTemplate } from './date-picker.template.js';
import { datePickerStyles } from './date-picker.styles.js';

/**
 * ml-date-picker - Date input with calendar dropdown
 *
 * Users can type a date directly into the input or pick from the calendar popover.
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
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'required', 'min', 'max', 'min-year', 'max-year']
})
export class DatePickerComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Selected date in ISO format (YYYY-MM-DD) */
	public value = '';

	/** Placeholder text */
	public placeholder = 'Select date';

	/** Field label */
	public label = '';

	/** Hint text */
	public hint = '';

	/** Error message */
	public error = '';

	/** Input size */
	public size: 'sm' | 'md' | 'lg' = 'md';

	/** Disabled state */
	public disabled = false;

	/** Required state */
	public required = false;

	/** Minimum selectable date (YYYY-MM-DD) */
	public min = '';

	/** Maximum selectable date (YYYY-MM-DD) */
	public max = '';

	/** Earliest year reachable in the year picker (defaults to currentYear - 120) */
	public minYear: number | string = '';

	/** Latest year reachable in the year picker (defaults to currentYear + 10) */
	public maxYear: number | string = '';

	/** Whether the calendar popover is open */
	public isOpen = false;

	private _cleanupAutoUpdate: (() => void) | null = null;

	public onCreate(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.addEventListener('toggle', this._handleToggle);
		}
	}

	public onDestroy(): void {
		this._cleanupAutoUpdate?.();
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.removeEventListener('toggle', this._handleToggle);
		}
	}

	public toggleCalendar = (): void => {
		if (this.disabled) return;
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.togglePopover();
		}
	};

	/** Called when the user types a date into the input */
	public handleInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		this.commitValue(input.value);
	};

	/** Clicking the input opens the calendar */
	public handleInputClick = (): void => {
		if (!this.isOpen) {
			this.toggleCalendar();
		}
	};

	/** Called when a day is clicked in the calendar - selects immediately and closes */
	public handleDateSelect = (event: Event): void => {
		event.stopPropagation();
		const detail = (event as CustomEvent).detail as { value: string };
		this.commitValue(detail.value);
		this.closePopover();
	};

	public handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape' && this.isOpen) {
			event.preventDefault();
			this.closePopover();
		}
		// Prevent Space from triggering the native date picker
		if (event.key === ' ') {
			event.preventDefault();
			if (!this.isOpen) {
				this.toggleCalendar();
			}
		}
		// Prevent F4 / Alt+Down from triggering the native picker in some browsers
		if (event.key === 'F4' || (event.altKey && event.key === 'ArrowDown')) {
			event.preventDefault();
			if (!this.isOpen) {
				this.toggleCalendar();
			}
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
		const inputEl = this.getInputEl();
		if (inputEl) {
			inputEl.focus();
		}
	}

	private getInputEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-date-picker__input') as HTMLElement | null;
	}

	private getTriggerEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-date-picker__trigger') as HTMLElement | null;
	}

	private getPopoverEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-date-picker__popover') as HTMLElement | null;
	}
}
