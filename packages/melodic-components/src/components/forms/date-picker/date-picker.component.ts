import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import { OverlayPositioner } from '../../../utils/overlay/index.js';
import { isDeepFocusWithin } from '../../../utils/accessibility/focus-trap.js';
import { datePickerTemplate } from './date-picker.template.js';
import { datePickerStyles } from './date-picker.styles.js';

registerAdapter<string>((el) => el.tagName === 'ML-DATE-PICKER', {
	inputEvent: 'ml:change',
	blurEvent: 'focusout',
	getValue: (el) => (el as unknown as { value: string }).value ?? '',
	setValue: (el, value) => { (el as unknown as { value: string }).value = value !== null && value !== undefined ? String(value) : ''; },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

/**
 * Format an ISO date (YYYY-MM-DD) for display in `locale`.
 *
 * The display format used to be hardcoded MM/DD/YYYY, which is wrong almost
 * everywhere outside the US. `Intl` picks the locale's own numeric order.
 */
function formatDisplayDate(iso: string, locale?: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
	if (!match) return iso ?? '';

	const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
	return dateFormatter(locale).format(date);
}

/**
 * Short numeric date formatter for `locale` (the browser's when empty).
 * An unknown or malformed locale tag falls back to the browser's instead of
 * throwing out of the render.
 */
function dateFormatter(locale?: string): Intl.DateTimeFormat {
	const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
	try {
		return new Intl.DateTimeFormat(locale || undefined, options);
	} catch {
		return new Intl.DateTimeFormat(undefined, options);
	}
}

/** Order of the numeric parts in `locale`'s short date format. */
function localeDateOrder(locale?: string): ('year' | 'month' | 'day')[] {
	const parts = dateFormatter(locale).formatToParts(new Date(2001, 1, 3));

	return parts
		.filter((part): part is Intl.DateTimeFormatPart & { type: 'year' | 'month' | 'day' } => part.type === 'year' || part.type === 'month' || part.type === 'day')
		.map((part) => part.type);
}

/**
 * Map every Unicode decimal digit to ASCII and drop bidi control marks, so
 * text in the locale's own numbering system (`٠٣/٠٢/٢٠٠١`) parses.
 */
function normalizeDateText(text: string): string {
	return text
		.replace(/[\u200e\u200f\u061c]/g, '')
		.replace(/\p{Nd}/gu, (digit) => {
			if (digit >= '0' && digit <= '9') return digit;
			// Decimal-digit blocks are contiguous runs of ten starting at zero.
			const code = digit.codePointAt(0)!;
			for (let zero = code; zero > code - 10; zero--) {
				if (!/\p{Nd}/u.test(String.fromCodePoint(zero - 1))) {
					return String(code - zero);
				}
			}
			return digit;
		})
		.trim();
}

/**
 * Parse typed text into an ISO date (YYYY-MM-DD). Returns null when invalid.
 *
 * Accepts `YYYY-MM-DD` and the locale's own short date — whatever
 * `formatDisplayDate` produces must parse back, or simply re-committing the
 * field's own text reverts it. That includes formats whose separators are not
 * a single `/`, `.` or `-` (`2001. 02. 03.` in ko-KR / hu-HU), trailing
 * literals (`03.02.2001 г.` in bg) and non-ASCII digits (ar-EG).
 */
function parseDateInput(text: string, locale?: string): string | null {
	const trimmed = normalizeDateText(text);
	let year: number;
	let month: number;
	let day: number;

	const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
	if (iso) {
		year = Number(iso[1]);
		month = Number(iso[2]);
		day = Number(iso[3]);
	} else {
		// Three numeric groups in the locale's own order rather than assuming
		// MM/DD/YYYY — a user typing 03/02/2001 in en-GB means 3 February.
		const groups = trimmed.match(/\d+/g);
		if (!groups || groups.length !== 3 || groups.some((group) => group.length > 4)) return null;

		// Whatever sits between/around the numbers must be punctuation or
		// the locale's own literal text — not stray words or signs.
		const literalChars = new Set<string>();
		for (const part of dateFormatter(locale).formatToParts(new Date(2001, 1, 3))) {
			if (part.type === 'literal') {
				for (const char of normalizeDateText(part.value)) literalChars.add(char);
			}
		}
		for (const char of trimmed.replace(/\d+/g, '')) {
			if (!/[\s./,-]/.test(char) && !literalChars.has(char)) return null;
		}

		const order = localeDateOrder(locale);
		const values = { year: 0, month: 0, day: 0 };
		order.forEach((part, index) => {
			values[part] = Number(groups[index]);
		});

		year = values.year;
		month = values.month;
		day = values.day;

		if (year < 100) {
			year += year < 50 ? 2000 : 1900;
		}
	}

	if (month < 1 || month > 12) return null;
	const daysInMonth = new Date(year, month, 0).getDate();
	if (day < 1 || day > daysInMonth) return null;

	return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * ml-date-picker - Date input with calendar dropdown
 *
 * Users can type a date directly into the input (the locale's short date or `YYYY-MM-DD`)
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
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'required', 'min', 'max', 'min-year', 'max-year', 'locale']
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

	/**
	 * BCP 47 locale for the displayed and accepted date format. Defaults to
	 * the browser's locale — the format used to be hardcoded MM/DD/YYYY.
	 */
	public locale = '';

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
		return formatDisplayDate(this.value, this.locale);
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

		const iso = parseDateInput(text, this.locale);
		if (iso && this.isWithinRange(iso)) {
			this.commitValue(iso);
			// Normalize the display immediately (re-render may be skipped when the
			// committed value is unchanged).
			input.value = formatDisplayDate(iso, this.locale);
		} else {
			// Invalid or out-of-range input: revert to the last committed value,
			// matching what the calendar enforces for min/max.
			input.value = this.displayValue;
		}
	};

	/** ISO dates (YYYY-MM-DD) compare correctly as strings. */
	private isWithinRange(iso: string): boolean {
		if (this.min && iso < this.min) return false;
		if (this.max && iso > this.max) return false;
		return true;
	}

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
			// Restore focus for keyboard (Escape) and inside-overlay dismissals —
			// including native popover light-dismiss (e.g. Escape pressed while
			// focus is parked in the calendar), which would otherwise drop focus
			// to <body>. Pointer light-dismiss that moved focus elsewhere must
			// not have it yanked back.
			if (this._restoreFocusOnClose || isDeepFocusWithin(this.elementRef)) {
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
