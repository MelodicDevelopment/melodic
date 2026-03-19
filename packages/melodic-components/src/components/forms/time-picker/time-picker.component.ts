import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy } from '@melodicdev/core';
import { computePosition, autoUpdate, offset, flip, shift } from '../../../utils/positioning/index.js';
import { timePickerTemplate } from './time-picker.template.js';
import { timePickerStyles } from './time-picker.styles.js';

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

function formatDisplay(value: string, use12Hour: boolean): string {
	if (!value) return '';
	const parts = value.split(':');
	if (parts.length < 2) return value;
	let h = parseInt(parts[0], 10);
	const m = parts[1];
	const s = parts[2];
	const timeSuffix = s ? `:${s}` : '';
	if (!use12Hour) return `${pad(h)}:${m}${timeSuffix}`;
	const period = h >= 12 ? 'PM' : 'AM';
	if (h === 0) h = 12;
	else if (h > 12) h -= 12;
	return `${h}:${m}${timeSuffix} ${period}`;
}

function clamp(val: number, min: number, max: number): number {
	if (val < min) return max;
	if (val > max) return min;
	return val;
}

/**
 * ml-time-picker - Time input with dropdown selector
 *
 * @example
 * ```html
 * <ml-time-picker label="Start time" value="09:30"></ml-time-picker>
 * <ml-time-picker label="Meeting" use-12-hour value="14:00"></ml-time-picker>
 * <ml-time-picker label="Precise" step="1"></ml-time-picker>
 * ```
 *
 * @fires ml:change - Emitted when the time changes. Detail: { value: string }
 */
@MelodicComponent({
	selector: 'ml-time-picker',
	template: timePickerTemplate,
	styles: timePickerStyles,
	attributes: ['value', 'placeholder', 'label', 'hint', 'error', 'size', 'disabled', 'required', 'min', 'max', 'step', 'twelve-hour']
})
export class TimePickerComponent implements IElementRef, OnCreate, OnDestroy {
	public elementRef!: HTMLElement;

	/** Selected time in HH:mm or HH:mm:ss format */
	public value = '';

	/** Placeholder text */
	public placeholder = 'Select time';

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

	/** Minimum selectable time (HH:mm) */
	public min = '';

	/** Maximum selectable time (HH:mm) */
	public max = '';

	/** Step in minutes (default 15) for the preset list. Use 1 to show seconds spinner. */
	public step = 15;

	/** Use 12-hour format with AM/PM (default: true) */
	public twelveHour = true;

	/** Whether the popover is open */
	public isOpen = false;

	/** Current editing hour */
	public editHour = 0;

	/** Current editing minute */
	public editMinute = 0;

	/** Current editing second */
	public editSecond = 0;

	/** AM or PM when in 12-hour mode */
	public editPeriod: 'AM' | 'PM' = 'AM';

	private _cleanupAutoUpdate: (() => void) | null = null;

	public get use12Hour(): boolean {
		return this.twelveHour;
	}

	public get showSeconds(): boolean {
		return Number(this.step) === 1;
	}

	public get displayValue(): string {
		return formatDisplay(this.value, this.use12Hour);
	}

	public get displayHour(): string {
		if (this.use12Hour) {
			let h = this.editHour;
			if (h === 0) h = 12;
			else if (h > 12) h -= 12;
			return String(h);
		}
		return pad(this.editHour);
	}

	public get displayMinute(): string {
		return pad(this.editMinute);
	}

	public get displaySecond(): string {
		return pad(this.editSecond);
	}

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

	public togglePopover = (): void => {
		if (this.disabled) return;
		const popoverEl = this.getPopoverEl();
		if (popoverEl) {
			popoverEl.togglePopover();
		}
	};

	public incrementHour = (): void => {
		if (this.use12Hour) {
			// Cycle within the current 12-hour half (AM: 0–11, PM: 12–23)
			const base = this.editPeriod === 'AM' ? 0 : 12;
			const offset = (this.editHour - base + 1) % 12;
			this.editHour = base + offset;
		} else {
			this.editHour = clamp(this.editHour + 1, 0, 23);
		}
	};

	public decrementHour = (): void => {
		if (this.use12Hour) {
			const base = this.editPeriod === 'AM' ? 0 : 12;
			const offset = (this.editHour - base - 1 + 12) % 12;
			this.editHour = base + offset;
		} else {
			this.editHour = clamp(this.editHour - 1, 0, 23);
		}
	};

	public incrementMinute = (): void => {
		this.editMinute = clamp(this.editMinute + 1, 0, 59);
	};

	public decrementMinute = (): void => {
		this.editMinute = clamp(this.editMinute - 1, 0, 59);
	};

	public incrementSecond = (): void => {
		this.editSecond = clamp(this.editSecond + 1, 0, 59);
	};

	public decrementSecond = (): void => {
		this.editSecond = clamp(this.editSecond - 1, 0, 59);
	};

	public togglePeriod = (): void => {
		this.editPeriod = this.editPeriod === 'AM' ? 'PM' : 'AM';
		const h12 = this.editHour % 12 || 12;
		this.editHour = this.to24Hour(h12, this.editPeriod);
	};

	public confirmSelection = (): void => {
		let timeStr = `${pad(this.editHour)}:${pad(this.editMinute)}`;
		if (this.showSeconds) {
			timeStr += `:${pad(this.editSecond)}`;
		}
		this.commitValue(timeStr);
		this.closePopover();
	};

	public handleNowClick = (): void => {
		const now = new Date();
		this.editHour = now.getHours();
		this.editMinute = now.getMinutes();
		this.editSecond = now.getSeconds();
		this.editPeriod = this.editHour >= 12 ? 'PM' : 'AM';
	};

	public handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape' && this.isOpen) {
			event.preventDefault();
			this.closePopover();
		} else if ((event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') && !this.isOpen) {
			event.preventDefault();
			this.togglePopover();
		}
	};

	public handleHourInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		const digits = input.value.replace(/\D/g, '').slice(0, 2);
		if (digits === '') { input.value = ''; return; }
		const max = this.use12Hour ? 12 : 23;
		const min = this.use12Hour ? 1 : 0;
		const n = Math.max(min, Math.min(parseInt(digits, 10), max));
		input.value = String(n);
		if (this.use12Hour) {
			this.editHour = this.to24Hour(n, this.editPeriod);
		} else {
			this.editHour = n;
		}
	};

	public handleMinuteInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		const digits = input.value.replace(/\D/g, '').slice(0, 2);
		if (digits === '') { input.value = ''; return; }
		const n = Math.min(parseInt(digits, 10), 59);
		input.value = String(n);
		this.editMinute = n;
	};

	public handleSecondInput = (event: Event): void => {
		const input = event.target as HTMLInputElement;
		const digits = input.value.replace(/\D/g, '').slice(0, 2);
		if (digits === '') { input.value = ''; return; }
		const n = Math.min(parseInt(digits, 10), 59);
		input.value = String(n);
		this.editSecond = n;
	};

	public handleHourBlur = (): void => {
		if (this.use12Hour) {
			const h12 = this.editHour % 12 || 12;
			this.editHour = this.to24Hour(h12, this.editPeriod);
		}
	};

	public handleMinuteBlur = (): void => {
		// Re-render to reformat with padding
	};

	public handleSecondBlur = (): void => {
		// Re-render to reformat with padding
	};

	public handleInputFocus = (event: Event): void => {
		(event.target as HTMLInputElement).select();
	};

	public handleSpinnerKeyDown = (event: KeyboardEvent): void => {
		const target = event.target as HTMLInputElement;
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			const label = target.getAttribute('aria-label');
			if (label === 'Hour') this.incrementHour();
			else if (label === 'Minute') this.incrementMinute();
			else if (label === 'Second') this.incrementSecond();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			const label = target.getAttribute('aria-label');
			if (label === 'Hour') this.decrementHour();
			else if (label === 'Minute') this.decrementMinute();
			else if (label === 'Second') this.decrementSecond();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			this.confirmSelection();
		}
	};

	private to24Hour(h12: number, period: 'AM' | 'PM'): number {
		if (period === 'AM') return h12 === 12 ? 0 : h12;
		return h12 === 12 ? 12 : h12 + 12;
	}

	private syncEditFromValue(): void {
		if (this.value) {
			const parts = this.value.split(':');
			this.editHour = parseInt(parts[0], 10) || 0;
			this.editMinute = parseInt(parts[1], 10) || 0;
			this.editSecond = parts[2] ? parseInt(parts[2], 10) : 0;
		} else {
			const now = new Date();
			this.editHour = now.getHours();
			this.editMinute = now.getMinutes();
			this.editSecond = 0;
		}
		this.editPeriod = this.editHour >= 12 ? 'PM' : 'AM';
	}

	private commitValue(timeStr: string): void {
		this.value = timeStr;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: timeStr }
			})
		);
	}

	private readonly _handleToggle = (event: Event): void => {
		const toggleEvent = event as ToggleEvent;
		if (toggleEvent.newState === 'open') {
			this.isOpen = true;
			this.syncEditFromValue();
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
		return this.elementRef.shadowRoot?.querySelector('.ml-time-picker__trigger') as HTMLElement | null;
	}

	private getPopoverEl(): HTMLElement | null {
		return this.elementRef.shadowRoot?.querySelector('.ml-time-picker__popover') as HTMLElement | null;
	}
}
