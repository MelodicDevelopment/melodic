import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { dateTimePickerTemplate } from './date-time-picker.template.js';
import { dateTimePickerStyles } from './date-time-picker.styles.js';

// Ensure sub-components are registered
import '../date-picker/date-picker.component.js';
import '../time-picker/time-picker.component.js';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateTimeDisplay(value: string, use12Hour: boolean): string {
	if (!value) return '';
	const [datePart, timePart] = value.split('T');
	if (!datePart) return '';

	const dateParts = datePart.split('-');
	if (dateParts.length !== 3) return value;
	const month = parseInt(dateParts[1], 10) - 1;
	const day = parseInt(dateParts[2], 10);
	const year = parseInt(dateParts[0], 10);
	let display = `${MONTH_SHORT[month]} ${day}, ${year}`;

	if (timePart) {
		const timeParts = timePart.split(':');
		let h = parseInt(timeParts[0], 10);
		const m = timeParts[1];
		if (use12Hour) {
			const period = h >= 12 ? 'PM' : 'AM';
			if (h === 0) h = 12;
			else if (h > 12) h -= 12;
			display += ` ${h}:${m} ${period}`;
		} else {
			display += ` ${String(h).padStart(2, '0')}:${m}`;
		}
	}

	return display;
}

/**
 * ml-date-time-picker - Combined date and time picker
 *
 * Composes ml-date-picker and ml-time-picker into a single control.
 * Value format: ISO datetime string (YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss)
 *
 * @example
 * ```html
 * <ml-date-time-picker label="Event start" value="2026-02-08T09:30"></ml-date-time-picker>
 * <ml-date-time-picker label="Meeting" use-12-hour></ml-date-time-picker>
 * ```
 *
 * @fires ml:change - Emitted when value changes. Detail: { value: string, date: string, time: string }
 */
@MelodicComponent({
	selector: 'ml-date-time-picker',
	template: dateTimePickerTemplate,
	styles: dateTimePickerStyles,
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'required', 'min-date', 'max-date', 'min-time', 'max-time', 'step', 'twelve-hour']
})
export class DateTimePickerComponent implements IElementRef, OnCreate, OnDestroy {
	elementRef!: HTMLElement;

	/** Selected datetime in ISO format (YYYY-MM-DDTHH:mm) */
	value = '';

	/** Placeholder text */
	placeholder = 'Select date and time';

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
	minDate = '';

	/** Maximum selectable date (YYYY-MM-DD) */
	maxDate = '';

	/** Minimum selectable time (HH:mm) */
	minTime = '';

	/** Maximum selectable time (HH:mm) */
	maxTime = '';

	/** Time step in minutes */
	step = 15;

	/** Use 12-hour format (default: true) */
	twelveHour = true;

	/** Internal date portion */
	dateValue = '';

	/** Internal time portion */
	timeValue = '';

	private _listeners: Array<() => void> = [];

	get use12Hour(): boolean {
		return this.twelveHour;
	}

	get displayValue(): string {
		return formatDateTimeDisplay(this.value, this.use12Hour);
	}

	onCreate(): void {
		this.syncFromValue();
		this.attachChildListeners();
	}

	onDestroy(): void {
		for (const cleanup of this._listeners) cleanup();
		this._listeners = [];
	}

	private syncFromValue(): void {
		if (!this.value) return;
		const [datePart, timePart] = this.value.split('T');
		if (datePart) this.dateValue = datePart;
		if (timePart) this.timeValue = timePart;
	}

	private attachChildListeners(): void {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;

		const datePicker = shadow.querySelector('ml-date-picker');
		const timePicker = shadow.querySelector('ml-time-picker');

		if (datePicker) {
			const handler = (e: Event) => {
				e.stopPropagation();
				this.dateValue = (e as CustomEvent).detail.value;
				this.emitChange();
			};
			datePicker.addEventListener('ml:change', handler);
			this._listeners.push(() => datePicker.removeEventListener('ml:change', handler));
		}

		if (timePicker) {
			const handler = (e: Event) => {
				e.stopPropagation();
				this.timeValue = (e as CustomEvent).detail.value;
				this.emitChange();
			};
			timePicker.addEventListener('ml:change', handler);
			this._listeners.push(() => timePicker.removeEventListener('ml:change', handler));
		}
	}

	private emitChange(): void {
		if (this.dateValue && this.timeValue) {
			this.value = `${this.dateValue}T${this.timeValue}`;
		} else if (this.dateValue) {
			this.value = this.dateValue;
		} else if (this.timeValue) {
			this.value = this.timeValue;
		}

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: {
					value: this.value,
					date: this.dateValue,
					time: this.timeValue
				}
			})
		);
	}
}
