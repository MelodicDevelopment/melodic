import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import { OverlayPositioner } from '../../../utils/overlay/index.js';
import { datePickerTemplate } from './date-picker.template.js';
import { datePickerStyles } from './date-picker.styles.js';

registerAdapter<string>((el) => el.tagName === 'ML-DATE-PICKER', {
	inputEvent: 'ml:change',
	blurEvent: 'focusout',
	getValue: (el) => (el as unknown as { value: string }).value ?? '',
	setValue: (el, value) => { (el as unknown as { value: string }).value = value !== null && value !== undefined ? String(value) : ''; },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

/** Format an ISO date (YYYY-MM-DD) for display as MM/DD/YYYY. */
function formatDisplayDate(iso: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
	if (!match) return iso ?? '';
	return `${match[2]}/${match[3]}/${match[1]}`;
}

/**
 * Parse typed text into an ISO date (YYYY-MM-DD).
 * Accepts `YYYY-MM-DD`, `MM/DD/YYYY`, and `M/D/YYYY`. Returns null when invalid.
 */
function parseDateInput(text: string): string | null {
	const trimmed = text.trim();
	let year: number;
	let month: number;
	let day: number;

	let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
	if (match) {
		year = Number(match[1]);
		month = Number(match[2]);
		day = Number(match[3]);
	} else {
		match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
		if (!match) return null;
		month = Number(match[1]);
		day = Number(match[2]);
		year = Number(match[3]);
	}

	if (month < 1 || month > 12) return null;
	const daysInMonth = new Date(year, month, 0).getDate();
	if (day < 1 || day > daysInMonth) return null;

	return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * ml-date-picker - Date input with calendar dropdown
 *
 * Users can type a date directly into the input (`MM/DD/YYYY` or `YYYY-MM-DD`)
 * or pick from the custom calendar popover. The input is a plain text field so
 * the native browser date picker never competes with the custom calendar.
 * `value` is always the ISO date (`YYYY-MM-DD`).
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

	private readonly _positioner = new OverlayPositioner(() => ({
		placement: 'bottom-start',
		offset: 4
	}));
	private _restoreFocusOnClose = false;

	/** The formatted text shown in the input (MM/DD/YYYY) */
	public get displayValue(): string {
		return formatDisplayDate(this.value);
	}

	public onCreate(): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.addEventListener('toggle', this._handleToggle);
		}
	}

	public onDestroy(): void {
		this._positioner.stop();
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

	/** Called when the user types a date into the input (on change/blur) */
	public handleInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		const text = input.value.trim();

		if (!text) {
			if (this.value !== '') {
				this.commitValue('');
			}
			input.value = '';
			return;
		}

		const iso = parseDateInput(text);
		if (iso) {
			this.commitValue(iso);
			// Normalize the display immediately (re-render may be skipped when the
			// committed value is unchanged).
			input.value = formatDisplayDate(iso);
		} else {
			// Invalid input: revert to the last committed value.
			input.value = this.displayValue;
		}
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
		// Dismissal originates inside the overlay — restore focus to the input.
		this.closePopover(true);
	};

	public handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape' && this.isOpen) {
			event.preventDefault();
			this.closePopover(true);
		}
		// F4 / Alt+Down open the custom calendar (standard combobox-style keys)
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
			this._positioner.stop();
			// Only restore focus for keyboard (Escape) or inside-overlay dismissals.
			// Pointer light-dismiss must not yank focus away from what was clicked.
			if (this._restoreFocusOnClose) {
				this.returnFocus();
			}
			this._restoreFocusOnClose = false;
		}
	};

	private closePopover(restoreFocus = false): void {
		const popoverEl = this.getPopoverEl();
		if (popoverEl && this.isOpen) {
			this._restoreFocusOnClose = restoreFocus;
			popoverEl.hidePopover();
		}
	}

	private startPositioning(): void {
		const triggerEl = this.getTriggerEl();
		const popoverEl = this.getPopoverEl();
		if (!triggerEl || !popoverEl) return;

		this._positioner.start(triggerEl, popoverEl);
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
