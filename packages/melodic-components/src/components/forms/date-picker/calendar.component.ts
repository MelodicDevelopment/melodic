import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnInit, OnAttributeChange } from '@melodicdev/core';
import { calendarTemplate } from './calendar.template.js';
import { calendarStyles } from './calendar.styles.js';

export interface CalendarDay {
	date: number;
	month: number;
	year: number;
	iso: string;
	isCurrentMonth: boolean;
	isToday: boolean;
	isSelected: boolean;
	isDisabled: boolean;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function toIso(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayIso(): string {
	const d = new Date();
	return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * ml-calendar - Standalone calendar grid
 *
 * @example
 * ```html
 * <ml-calendar value="2026-02-08"></ml-calendar>
 * <ml-calendar min="2026-01-01" max="2026-12-31"></ml-calendar>
 * ```
 *
 * @fires ml:select - Emitted when a date is selected. Detail: { value: string }
 */
@MelodicComponent({
	selector: 'ml-calendar',
	template: calendarTemplate,
	styles: calendarStyles,
	attributes: ['value', 'min', 'max']
})
export class CalendarComponent implements IElementRef, OnInit, OnAttributeChange {
	elementRef!: HTMLElement;

	/** Selected date in ISO format (YYYY-MM-DD) */
	value = '';

	/** Minimum selectable date (YYYY-MM-DD) */
	min = '';

	/** Maximum selectable date (YYYY-MM-DD) */
	max = '';

	/** Currently viewed month (0-11) */
	viewMonth = new Date().getMonth();

	/** Currently viewed year */
	viewYear = new Date().getFullYear();

	onInit(): void {
		this.navigateToValue();
	}

	onAttributeChange(name: string, _: unknown, newVal: unknown): void {
		if (name === 'value' && newVal) {
			this.navigateToValue();
		}
	}

	private navigateToValue(): void {
		if (!this.value) return;
		const parts = this.value.split('-');
		if (parts.length === 3) {
			this.viewYear = Number.parseInt(parts[0], 10);
			this.viewMonth = Number.parseInt(parts[1], 10) - 1;
		}
	}

	get monthLabel(): string {
		return `${MONTH_NAMES[this.viewMonth]} ${this.viewYear}`;
	}

	get weekdays(): string[] {
		return WEEKDAYS;
	}

	get days(): CalendarDay[] {
		const year = this.viewYear;
		const month = this.viewMonth;
		const firstDayOfWeek = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const daysInPrevMonth = new Date(year, month, 0).getDate();
		const today = todayIso();

		const result: CalendarDay[] = [];

		// Leading days from previous month
		const prevMonth = month === 0 ? 11 : month - 1;
		const prevYear = month === 0 ? year - 1 : year;
		for (let i = firstDayOfWeek - 1; i >= 0; i--) {
			const d = daysInPrevMonth - i;
			const iso = toIso(prevYear, prevMonth, d);
			result.push({
				date: d,
				month: prevMonth,
				year: prevYear,
				iso,
				isCurrentMonth: false,
				isToday: iso === today,
				isSelected: iso === this.value,
				isDisabled: this.isDisabled(iso)
			});
		}

		// Current month days
		for (let d = 1; d <= daysInMonth; d++) {
			const iso = toIso(year, month, d);
			result.push({
				date: d,
				month,
				year,
				iso,
				isCurrentMonth: true,
				isToday: iso === today,
				isSelected: iso === this.value,
				isDisabled: this.isDisabled(iso)
			});
		}

		// Trailing days to complete the last row only
		const nextMonth = month === 11 ? 0 : month + 1;
		const nextYear = month === 11 ? year + 1 : year;
		const remainder = result.length % 7;
		if (remainder > 0) {
			const trailingCount = 7 - remainder;
			for (let t = 1; t <= trailingCount; t++) {
				const iso = toIso(nextYear, nextMonth, t);
				result.push({
					date: t,
					month: nextMonth,
					year: nextYear,
					iso,
					isCurrentMonth: false,
					isToday: iso === today,
					isSelected: iso === this.value,
					isDisabled: this.isDisabled(iso)
				});
			}
		}

		return result;
	}

	prevYear = (): void => {
		this.viewYear--;
	};

	nextYear = (): void => {
		this.viewYear++;
	};

	prevMonth = (): void => {
		if (this.viewMonth === 0) {
			this.viewMonth = 11;
			this.viewYear--;
		} else {
			this.viewMonth--;
		}
	};

	nextMonth = (): void => {
		if (this.viewMonth === 11) {
			this.viewMonth = 0;
			this.viewYear++;
		} else {
			this.viewMonth++;
		}
	};

	selectDay = (day: CalendarDay): void => {
		if (day.isDisabled) return;
		this.value = day.iso;
		// Navigate to the selected day's month if it's not the current view
		this.viewMonth = day.month;
		this.viewYear = day.year;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:select', {
				bubbles: true,
				composed: true,
				detail: { value: day.iso }
			})
		);
	};

	goToToday = (): void => {
		const now = new Date();
		this.viewMonth = now.getMonth();
		this.viewYear = now.getFullYear();
		const iso = todayIso();
		if (!this.isDisabled(iso)) {
			this.value = iso;
			this.elementRef.dispatchEvent(
				new CustomEvent('ml:select', {
					bubbles: true,
					composed: true,
					detail: { value: iso }
				})
			);
		}
	};

	private isDisabled(iso: string): boolean {
		if (this.min && iso < this.min) return true;
		if (this.max && iso > this.max) return true;
		return false;
	}
}
