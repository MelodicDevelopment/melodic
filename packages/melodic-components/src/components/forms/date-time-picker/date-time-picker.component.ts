import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { registerAdapter } from '@melodicdev/core/forms';
import { dateTimePickerTemplate } from './date-time-picker.template.js';
import { dateTimePickerStyles } from './date-time-picker.styles.js';
import {
	formatTimezoneLabel,
	formatViewerHint,
	isUtcIsoString,
	naiveToUtcIso,
	utcToNaive,
	viewerOffsetDiffersAt
} from './tz-utils.js';
import type { TimezoneLabelFormat } from './tz-utils.js';

registerAdapter<string>((el) => el.tagName === 'ML-DATE-TIME-PICKER', {
	inputEvent: 'ml:change',
	blurEvent: 'focusout',
	getValue: (el) => (el as unknown as { value: string }).value ?? '',
	setValue: (el, value) => { (el as unknown as { value: string }).value = value !== null && value !== undefined ? String(value) : ''; },
	setDisabled: (el, disabled) => { (el as unknown as { disabled: boolean }).disabled = disabled; }
});

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
 * ml-date-time-picker - Combined date and time picker with optional timezone support.
 *
 * Composes `ml-date-picker` and `ml-time-picker` into a single control.
 *
 * **Without `timezone`** (default): treats `value` as a naive wall-clock
 * string `YYYY-MM-DDTHH:mm`. Behavior is byte-identical to a plain date+time
 * input — no UTC conversion happens.
 *
 * **With `timezone`** (IANA name, e.g. `America/Detroit`): the picker
 * anchors the wall-clock the user sees to the named zone. If the incoming
 * `value` is a UTC ISO string (`...Z` or `±HH:MM` offset), it is parsed as a
 * real instant and rendered as the equivalent wall-clock in `timezone`. If
 * the incoming value is naive, it is treated as wall-clock in `timezone`.
 * The `ml:change` event detail then includes a `valueUtc` field so consumers
 * can store/round-trip the real UTC instant without zone drift.
 *
 * @example Naive (current behavior — unchanged)
 * ```html
 * <ml-date-time-picker label="Event start" value="2026-02-08T09:30"></ml-date-time-picker>
 * ```
 *
 * @example Timezone-anchored
 * ```html
 * <ml-date-time-picker
 *   label="Event start"
 *   timezone="America/Detroit"
 *   value="2026-04-27T13:00:00Z"
 *   timezone-label="short"
 *   viewer-hint
 * ></ml-date-time-picker>
 * ```
 *
 * Then in the consumer:
 * ```ts
 * picker.addEventListener('ml:change', (e) => {
 *   // e.detail.value    → naive wall-clock in the picker's zone
 *   // e.detail.valueUtc → '2026-04-27T13:00:00.000Z' — POST this to your API
 *   // e.detail.timezone → 'America/Detroit'
 *   fetch('/api/events', { method: 'POST', body: JSON.stringify({ startsAt: e.detail.valueUtc }) });
 * });
 * ```
 *
 * @fires ml:change - Detail: `{ value: string, date: string, time: string, valueUtc?: string, timezone?: string }`
 */
@MelodicComponent({
	selector: 'ml-date-time-picker',
	template: dateTimePickerTemplate,
	styles: dateTimePickerStyles,
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'required', 'min-date', 'max-date', 'min-time', 'max-time', 'step', 'twelve-hour', 'timezone', 'timezone-label', 'viewer-hint']
})
export class DateTimePickerComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/**
	 * Selected datetime.
	 *
	 * - When `timezone` is unset: a naive `YYYY-MM-DDTHH:mm` string.
	 * - When `timezone` is set: either a UTC ISO string (`...Z`/`±HH:MM`)
	 *   or a naive `YYYY-MM-DDTHH:mm` interpreted as wall-clock in `timezone`.
	 */
	public value = '';

	/** Placeholder text */
	public placeholder = 'Select date and time';

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
	public minDate = '';

	/** Maximum selectable date (YYYY-MM-DD) */
	public maxDate = '';

	/** Minimum selectable time (HH:mm) */
	public minTime = '';

	/** Maximum selectable time (HH:mm) */
	public maxTime = '';

	/** Time step in minutes */
	public step = 15;

	/** Use 12-hour format (default: true) */
	public twelveHour = true;

	/**
	 * IANA timezone name (e.g. `America/Detroit`). When set, the picker
	 * interprets/emits values anchored to this zone. When unset (default),
	 * values are naive wall-clock strings.
	 */
	public timezone = '';

	/**
	 * How to render the trailing timezone label.
	 *
	 * - `short`  → `EDT`
	 * - `long`   → `Eastern Daylight Time`
	 * - `offset` → `GMT-4`
	 * - `none`   → don't render a label
	 */
	public timezoneLabel: TimezoneLabelFormat = 'short';

	/**
	 * When true AND the browser's UTC offset differs from `timezone` at the
	 * current value's instant, render a small subdued line below the input
	 * showing the equivalent wall-clock in the viewer's local zone.
	 */
	public viewerHint = false;

	/** Internal date portion (always naive YYYY-MM-DD in the picker's zone) */
	public dateValue = '';

	/** Internal time portion (always naive HH:mm in the picker's zone) */
	public timeValue = '';

	private _listeners: Array<() => void> = [];
	private _lastSyncedValue = '';

	public get use12Hour(): boolean {
		return this.twelveHour;
	}

	public get displayValue(): string {
		return formatDateTimeDisplay(this.naiveValue, this.use12Hour);
	}

	/** The naive wall-clock string the user sees, regardless of input format. */
	public get naiveValue(): string {
		if (this.dateValue && this.timeValue) return `${this.dateValue}T${this.timeValue}`;
		if (this.dateValue) return this.dateValue;
		if (this.timeValue) return this.timeValue;
		return '';
	}

	/** Derived UTC ISO for the current naive value. Empty string when no timezone. */
	public get valueUtc(): string {
		if (!this.timezone) return '';
		const naive = this.naiveValue;
		if (!naive || !naive.includes('T')) return '';
		return naiveToUtcIso(naive, this.timezone);
	}

	/** Trailing timezone label text (e.g. `EDT`). Empty when no timezone or label='none'. */
	public get tzLabelText(): string {
		if (!this.timezone || this.timezoneLabel === 'none') return '';
		const instant = this.currentInstant() ?? new Date();
		return formatTimezoneLabel(instant, this.timezone, this.timezoneLabel);
	}

	/** Whether the viewer-hint line should be shown right now. */
	public get showViewerHint(): boolean {
		if (!this.viewerHint || !this.timezone) return false;
		const instant = this.currentInstant();
		if (!instant) return false;
		return viewerOffsetDiffersAt(instant, this.timezone);
	}

	/** Pre-rendered viewer hint text (e.g. `(6:00 AM PDT your time)`). */
	public get viewerHintText(): string {
		const instant = this.currentInstant();
		if (!instant) return '';
		const { wallClock, label } = formatViewerHint(instant, 'short');
		return label ? `(${wallClock} ${label} your time)` : `(${wallClock} your time)`;
	}

	public onCreate(): void {
		this.syncFromValue();
		this.attachChildListeners();
	}

	public onDestroy(): void {
		for (const cleanup of this._listeners) cleanup();
		this._listeners = [];
	}

	public onPropertyChange(name: string, _oldVal: unknown, _newVal: unknown): void {
		if (name === 'value' || name === 'timezone') {
			// Re-derive internal date/time when the inbound value (or its
			// anchor zone) changes from outside the component.
			queueMicrotask(() => this.syncFromValue());
		}
	}

	private currentInstant(): Date | null {
		if (!this.timezone) return null;
		const utcIso = this.valueUtc;
		if (!utcIso) return null;
		const d = new Date(utcIso);
		return Number.isNaN(d.getTime()) ? null : d;
	}

	private syncFromValue(): void {
		const incoming = this.value ?? '';
		if (incoming === this._lastSyncedValue) return;
		this._lastSyncedValue = incoming;

		if (!incoming) {
			this.dateValue = '';
			this.timeValue = '';
			return;
		}

		// With a timezone AND a UTC ISO input, project onto the zone's wall-clock.
		if (this.timezone && isUtcIsoString(incoming)) {
			const naive = utcToNaive(incoming, this.timezone);
			const [datePart, timePart] = naive.split('T');
			if (datePart) this.dateValue = datePart;
			if (timePart) this.timeValue = timePart;
			return;
		}

		// Otherwise treat incoming as naive (zoned or unzoned — both render the same).
		const [datePart, timePart] = incoming.split('T');
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

		// Bridge Tab focus between date input and time input across shadow boundaries.
		// Internal segment navigation (month→day→year, hour→minute→am/pm) doesn't
		// fire focusout on the <input>, so we only intercept when focus actually leaves.
		if (datePicker && timePicker) {
			const dateInput = datePicker.shadowRoot?.querySelector('input') as HTMLInputElement | null;
			const timeInput = timePicker.shadowRoot?.querySelector('input') as HTMLInputElement | null;

			if (dateInput && timeInput) {
				let tabForward = false;
				let tabBackward = false;

				const dateKeydown = (e: KeyboardEvent) => {
					if (e.key === 'Tab' && !e.shiftKey) {
						tabForward = true;
						requestAnimationFrame(() => { tabForward = false; });
					}
				};
				const dateFocusOut = () => {
					if (tabForward) {
						tabForward = false;
						timeInput.focus();
					}
				};
				dateInput.addEventListener('keydown', dateKeydown);
				dateInput.addEventListener('focusout', dateFocusOut);
				this._listeners.push(() => {
					dateInput.removeEventListener('keydown', dateKeydown);
					dateInput.removeEventListener('focusout', dateFocusOut);
				});

				const timeKeydown = (e: KeyboardEvent) => {
					if (e.key === 'Tab' && e.shiftKey) {
						tabBackward = true;
						requestAnimationFrame(() => { tabBackward = false; });
					}
				};
				const timeFocusOut = () => {
					if (tabBackward) {
						tabBackward = false;
						dateInput.focus();
					}
				};
				timeInput.addEventListener('keydown', timeKeydown);
				timeInput.addEventListener('focusout', timeFocusOut);
				this._listeners.push(() => {
					timeInput.removeEventListener('keydown', timeKeydown);
					timeInput.removeEventListener('focusout', timeFocusOut);
				});
			}
		}
	}

	private emitChange(): void {
		this.value = this.naiveValue;
		this._lastSyncedValue = this.value;

		const detail: {
			value: string;
			date: string;
			time: string;
			valueUtc?: string;
			timezone?: string;
		} = {
			value: this.value,
			date: this.dateValue,
			time: this.timeValue
		};

		if (this.timezone) {
			detail.timezone = this.timezone;
			const utc = this.valueUtc;
			if (utc) detail.valueUtc = utc;
		}

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail
			})
		);
	}
}
