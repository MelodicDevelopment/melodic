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

export interface CalendarMonth {
	index: number;
	label: string;
	isSelected: boolean;
	isCurrent: boolean;
	isDisabled: boolean;
}

export interface CalendarYear {
	year: number;
	isSelected: boolean;
	isCurrent: boolean;
	isDisabled: boolean;
	isPlaceholder: boolean;
}

export type CalendarView = 'day' | 'month' | 'year';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const YEARS_PER_PAGE = 12;
const DEFAULT_MIN_YEAR_OFFSET = 120;
const DEFAULT_MAX_YEAR_OFFSET = 10;

function toIso(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayIso(): string {
	const d = new Date();
	return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseYear(val: string | number): number | null {
	if (typeof val === 'number' && Number.isFinite(val)) return val;
	if (typeof val === 'string' && val.trim() !== '') {
		const n = Number.parseInt(val, 10);
		if (Number.isFinite(n)) return n;
	}
	return null;
}

/**
 * ml-calendar - Standalone calendar grid
 *
 * @example
 * ```html
 * <ml-calendar value="2026-02-08"></ml-calendar>
 * <ml-calendar min="2026-01-01" max="2026-12-31"></ml-calendar>
 * <ml-calendar min-year="1900" max-year="2030"></ml-calendar>
 * ```
 *
 * @fires ml:select - Emitted when a date is selected. Detail: { value: string }
 */
@MelodicComponent({
	selector: 'ml-calendar',
	template: calendarTemplate,
	styles: calendarStyles,
	attributes: ['value', 'min', 'max', 'min-year', 'max-year']
})
export class CalendarComponent implements IElementRef, OnInit, OnAttributeChange {
	public elementRef!: HTMLElement;

	/** Selected date in ISO format (YYYY-MM-DD) */
	public value = '';

	/** Minimum selectable date (YYYY-MM-DD) */
	public min = '';

	/** Maximum selectable date (YYYY-MM-DD) */
	public max = '';

	/** Earliest year reachable in the year picker (defaults to currentYear - 120) */
	public minYear: number | string = '';

	/** Latest year reachable in the year picker (defaults to currentYear + 10) */
	public maxYear: number | string = '';

	/** Currently viewed month (0-11) */
	public viewMonth = new Date().getMonth();

	/** Currently viewed year */
	public viewYear = new Date().getFullYear();

	/** Which sub-view the calendar is showing */
	public view: CalendarView = 'day';

	/** First year shown on the current page of the year grid */
	public yearPageStart = 0;

	public onInit(): void {
		this.navigateToValue();
		this.yearPageStart = this.computeYearPageStart(this.viewYear);
	}

	public onAttributeChange(name: string, _: unknown, newVal: unknown): void {
		if (name === 'value' && newVal) {
			this.navigateToValue();
			this.yearPageStart = this.computeYearPageStart(this.viewYear);
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

	public get monthLabel(): string {
		return MONTH_NAMES[this.viewMonth];
	}

	public get yearLabel(): string {
		return String(this.viewYear);
	}

	public get yearRangeLabel(): string {
		return `${this.yearPageStart} – ${this.yearPageStart + YEARS_PER_PAGE - 1}`;
	}

	public get headerLabel(): string {
		if (this.view === 'year') return this.yearRangeLabel;
		if (this.view === 'month') return this.yearLabel;
		return `${this.monthLabel} ${this.viewYear}`;
	}

	public get weekdays(): string[] {
		return WEEKDAYS;
	}

	public get resolvedMinYear(): number {
		const parsed = parseYear(this.minYear);
		return parsed ?? new Date().getFullYear() - DEFAULT_MIN_YEAR_OFFSET;
	}

	public get resolvedMaxYear(): number {
		const parsed = parseYear(this.maxYear);
		return parsed ?? new Date().getFullYear() + DEFAULT_MAX_YEAR_OFFSET;
	}

	public get days(): CalendarDay[] {
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

	public get months(): CalendarMonth[] {
		const selectedMonth = this.selectedMonthForYear(this.viewYear);
		const now = new Date();
		return MONTH_NAMES_SHORT.map((label, index) => ({
			index,
			label,
			isSelected: selectedMonth === index,
			isCurrent: now.getFullYear() === this.viewYear && now.getMonth() === index,
			isDisabled: this.isMonthDisabled(this.viewYear, index)
		}));
	}

	public get years(): CalendarYear[] {
		const result: CalendarYear[] = [];
		const selectedYear = this.selectedYear();
		const now = new Date().getFullYear();
		const minY = this.resolvedMinYear;
		const maxY = this.resolvedMaxYear;
		for (let i = 0; i < YEARS_PER_PAGE; i++) {
			const year = this.yearPageStart + i;
			const inRange = year >= minY && year <= maxY;
			result.push({
				year,
				isSelected: selectedYear === year,
				isCurrent: year === now,
				isDisabled: !inRange,
				isPlaceholder: !inRange && (year < minY || year > maxY)
			});
		}
		return result;
	}

	public get canPageYearsBack(): boolean {
		return this.yearPageStart > this.resolvedMinYear;
	}

	public get canPageYearsForward(): boolean {
		return this.yearPageStart + YEARS_PER_PAGE - 1 < this.resolvedMaxYear;
	}

	// ── Navigation ──────────────────────────────────────────────────────────

	public prevYear = (): void => {
		this.viewYear--;
	};

	public nextYear = (): void => {
		this.viewYear++;
	};

	public prevMonth = (): void => {
		if (this.viewMonth === 0) {
			this.viewMonth = 11;
			this.viewYear--;
		} else {
			this.viewMonth--;
		}
	};

	public nextMonth = (): void => {
		if (this.viewMonth === 11) {
			this.viewMonth = 0;
			this.viewYear++;
		} else {
			this.viewMonth++;
		}
	};

	public headerPrev = (): void => {
		if (this.view === 'year') this.prevYearPage();
		else if (this.view === 'month') this.prevYear();
		else this.prevMonth();
	};

	public headerNext = (): void => {
		if (this.view === 'year') this.nextYearPage();
		else if (this.view === 'month') this.nextYear();
		else this.nextMonth();
	};

	public headerPrevFar = (): void => {
		if (this.view === 'year') this.prevYearPage();
		else this.prevYear();
	};

	public headerNextFar = (): void => {
		if (this.view === 'year') this.nextYearPage();
		else this.nextYear();
	};

	public prevYearPage = (): void => {
		const next = this.yearPageStart - YEARS_PER_PAGE;
		const minPage = this.computeYearPageStart(this.resolvedMinYear);
		this.yearPageStart = Math.max(next, minPage);
	};

	public nextYearPage = (): void => {
		const next = this.yearPageStart + YEARS_PER_PAGE;
		const maxPage = this.computeYearPageStart(this.resolvedMaxYear);
		this.yearPageStart = Math.min(next, maxPage);
	};

	// ── View switching ──────────────────────────────────────────────────────

	public openMonthView = (): void => {
		this.view = this.view === 'month' ? 'day' : 'month';
	};

	public openYearView = (): void => {
		if (this.view === 'year') {
			this.view = 'day';
			return;
		}
		this.yearPageStart = this.computeYearPageStart(this.viewYear);
		this.view = 'year';
	};

	public selectViewMonth = (month: CalendarMonth): void => {
		if (month.isDisabled) return;
		this.viewMonth = month.index;
		this.view = 'day';
	};

	public selectViewYear = (year: CalendarYear): void => {
		if (year.isDisabled) return;
		this.viewYear = year.year;
		this.view = 'month';
	};

	// ── Day selection ───────────────────────────────────────────────────────

	public selectDay = (day: CalendarDay): void => {
		if (day.isDisabled) return;
		this.value = day.iso;
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

	public goToToday = (): void => {
		const now = new Date();
		this.viewMonth = now.getMonth();
		this.viewYear = now.getFullYear();
		this.view = 'day';
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

	// ── Keyboard navigation ─────────────────────────────────────────────────

	public handleGridKeyDown = (event: KeyboardEvent): void => {
		const key = event.key;
		if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'Home' && key !== 'End') {
			return;
		}
		const target = event.target as HTMLElement | null;
		if (!target || target.tagName !== 'BUTTON') return;
		const grid = target.closest('.ml-calendar__grid, .ml-calendar__cell-grid') as HTMLElement | null;
		if (!grid) return;
		const cells = Array.from(grid.querySelectorAll<HTMLButtonElement>('button:not([disabled])')).filter(
			(el) => el.tabIndex !== -1
		);
		if (cells.length === 0) return;
		const idx = cells.indexOf(target as HTMLButtonElement);
		if (idx === -1) return;

		const cols = this.view === 'day' ? 7 : 3;
		let nextIdx = idx;
		switch (key) {
			case 'ArrowLeft': nextIdx = idx - 1; break;
			case 'ArrowRight': nextIdx = idx + 1; break;
			case 'ArrowUp': nextIdx = idx - cols; break;
			case 'ArrowDown': nextIdx = idx + cols; break;
			case 'Home': nextIdx = 0; break;
			case 'End': nextIdx = cells.length - 1; break;
		}
		if (nextIdx < 0 || nextIdx >= cells.length) {
			event.preventDefault();
			return;
		}
		event.preventDefault();
		cells[nextIdx].focus();
	};

	// ── Helpers ─────────────────────────────────────────────────────────────

	private computeYearPageStart(year: number): number {
		const minY = this.resolvedMinYear;
		return minY + Math.floor((year - minY) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
	}

	private selectedMonthForYear(year: number): number | null {
		if (!this.value) return null;
		const parts = this.value.split('-');
		if (parts.length !== 3) return null;
		const y = Number.parseInt(parts[0], 10);
		if (y !== year) return null;
		return Number.parseInt(parts[1], 10) - 1;
	}

	private selectedYear(): number | null {
		if (!this.value) return null;
		const parts = this.value.split('-');
		if (parts.length !== 3) return null;
		return Number.parseInt(parts[0], 10);
	}

	private isMonthDisabled(year: number, month: number): boolean {
		// A month is disabled only if its entire range falls outside min/max.
		const lastDay = new Date(year, month + 1, 0).getDate();
		const monthEnd = toIso(year, month, lastDay);
		const monthStart = toIso(year, month, 1);
		if (this.min && monthEnd < this.min) return true;
		if (this.max && monthStart > this.max) return true;
		return false;
	}

	private isDisabled(iso: string): boolean {
		if (this.min && iso < this.min) return true;
		if (this.max && iso > this.max) return true;
		return false;
	}
}
