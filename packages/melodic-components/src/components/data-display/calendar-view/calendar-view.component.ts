import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender } from '@melodicdev/core';
import type { CalendarViewMode, CalendarEvent, CalendarDayCell, CalendarTimeColumn } from './calendar-view.types.js';
import {
	toIsoDate,
	parseDate,
	addDays,
	addMonths,
	startOfWeek,
	getMonthGrid,
	getWeekColumns,
	getDayColumn,
	getWeekdayHeaders,
	getISOWeekNumber,
	formatMonthYear,
	formatDateRange,
	getMonthAbbrev,
	getDayName,
	getEventsForDate,
	getTimeSlots,
	getMonthGrid as getMiniGrid,
	getMiniCalendarDots
} from './calendar-view.utils.js';
import { calendarViewTemplate } from './calendar-view.template.js';
import { calendarViewStyles } from './calendar-view.styles.js';

/**
 * ml-calendar-view - Full-featured calendar component with month, week, and day views
 *
 * @example
 * ```html
 * <ml-calendar-view .events=${events} view="month"></ml-calendar-view>
 * ```
 *
 * @fires ml:view-change - Emitted when the view mode changes. Detail: { view }
 * @fires ml:date-change - Emitted when the navigated date changes. Detail: { date }
 * @fires ml:event-click - Emitted when a calendar event is clicked. Detail: { event }
 * @fires ml:date-click - Emitted when a date cell is clicked. Detail: { date }
 * @fires ml:add-event - Emitted when the add event button is clicked. Detail: { date? }
 */
@MelodicComponent({
	selector: 'ml-calendar-view',
	template: calendarViewTemplate,
	styles: calendarViewStyles,
	attributes: ['view', 'date', 'week-starts-on', 'max-visible-events']
})
export class CalendarViewComponent implements IElementRef, OnCreate, OnDestroy, OnRender {
	elementRef!: HTMLElement;

	/** Current view mode */
	view: CalendarViewMode = 'month';

	/** Navigated date (ISO date string) */
	date = '';

	/** Day the week starts on (0=Sunday, 1=Monday) */
	weekStartsOn = 0;

	/** Maximum visible events per day cell in month view */
	maxVisibleEvents = 3;

	/** Calendar events (property-only) */
	events: CalendarEvent[] = [];

	/** Whether the view dropdown is open */
	isViewDropdownOpen = false;

	/** Mini calendar state for day view sidebar */
	private _miniCalYear = 0;
	private _miniCalMonth = 0;
	private _hasScrolledToTime = false;

	private _boundCloseDropdown: ((e: Event) => void) | null = null;

	// Current date object derived from the `date` attribute
	private get _currentDate(): Date {
		if (this.date) return parseDate(this.date);
		return new Date();
	}

	onCreate(): void {
		// Initialize date if not set
		if (!this.date) {
			const now = new Date();
			this.date = toIsoDate(now.getFullYear(), now.getMonth(), now.getDate());
		}
		// Init mini cal to current date's month
		const d = this._currentDate;
		this._miniCalYear = d.getFullYear();
		this._miniCalMonth = d.getMonth();

		// Close dropdown on outside click
		this._boundCloseDropdown = (e: Event) => {
			if (!this.isViewDropdownOpen) return;
			const path = e.composedPath();
			const shadow = this.elementRef.shadowRoot;
			if (!shadow) return;
			const dropdown = shadow.querySelector('.ml-cv__view-dropdown');
			if (dropdown && !path.includes(dropdown)) {
				this.isViewDropdownOpen = false;
			}
		};
		document.addEventListener('click', this._boundCloseDropdown, true);
	}

	onDestroy(): void {
		if (this._boundCloseDropdown) {
			document.removeEventListener('click', this._boundCloseDropdown, true);
		}
	}

	onRender(): void {
		// Auto-scroll time grid to ~6 AM on initial load
		if ((this.view === 'week' || this.view === 'day') && !this._hasScrolledToTime) {
			const shadow = this.elementRef.shadowRoot;
			if (!shadow) return;
			const scrollEl = shadow.querySelector('.ml-cv__time-scroll');
			if (scrollEl) {
				// 6 AM = row 12 (at 30-min increments), each row is 40px
				scrollEl.scrollTop = 12 * 40;
				this._hasScrolledToTime = true;
			}
		}
	}

	/* ── Header computed getters ── */

	get todayMonthAbbrev(): string {
		return getMonthAbbrev(new Date());
	}

	get todayDayNumber(): number {
		return new Date().getDate();
	}

	get headerTitle(): string {
		return formatMonthYear(this._currentDate);
	}

	get weekNumber(): number {
		return getISOWeekNumber(this._currentDate);
	}

	get headerSubtitle(): string {
		if (this.view === 'month') {
			return `Week ${this.weekNumber}`;
		}
		if (this.view === 'week') {
			const start = startOfWeek(this._currentDate, this.weekStartsOn);
			const end = addDays(start, 6);
			return formatDateRange(start, end);
		}
		// day view
		return getDayName(this._currentDate);
	}

	get currentIsoDate(): string {
		const d = this._currentDate;
		return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
	}

	/* ── Month view getters ── */

	get weekdayHeaders(): { short: string; full: string }[] {
		return getWeekdayHeaders(this.weekStartsOn);
	}

	get monthGrid(): CalendarDayCell[] {
		const d = this._currentDate;
		const grid = getMonthGrid(d.getFullYear(), d.getMonth(), this.weekStartsOn);
		// Populate events for each day cell
		for (const cell of grid) {
			cell.events = getEventsForDate(this.events, cell.iso);
		}
		return grid;
	}

	/* ── Week view getters ── */

	get weekColumns(): CalendarTimeColumn[] {
		return getWeekColumns(this._currentDate, this.weekStartsOn, this.events);
	}

	get timeSlots(): { label: string; hour: number; minute: number }[] {
		return getTimeSlots();
	}

	/* ── Day view getters ── */

	get dayColumn(): CalendarTimeColumn {
		return getDayColumn(this._currentDate, this.events);
	}

	get dayEvents(): CalendarEvent[] {
		return getEventsForDate(this.events, this.currentIsoDate);
	}

	get dayViewDateLabel(): string {
		const d = this._currentDate;
		return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
	}

	/* ── Mini calendar getters (day view sidebar) ── */

	get miniCalendarTitle(): string {
		return formatMonthYear(new Date(this._miniCalYear, this._miniCalMonth, 1));
	}

	get miniCalendarWeekdays(): string[] {
		return getWeekdayHeaders(this.weekStartsOn).map((h) => h.short.charAt(0));
	}

	get miniCalendarGrid(): CalendarDayCell[] {
		return getMiniGrid(this._miniCalYear, this._miniCalMonth, this.weekStartsOn);
	}

	get miniCalendarDots(): Set<string> {
		return getMiniCalendarDots(this._miniCalYear, this._miniCalMonth, this.events);
	}

	/* ── Navigation handlers ── */

	navigatePrev = (): void => {
		const d = this._currentDate;
		let next: Date;
		if (this.view === 'month') {
			next = addMonths(d, -1);
		} else if (this.view === 'week') {
			next = addDays(d, -7);
		} else {
			next = addDays(d, -1);
		}
		this.setDate(next);
	};

	navigateNext = (): void => {
		const d = this._currentDate;
		let next: Date;
		if (this.view === 'month') {
			next = addMonths(d, 1);
		} else if (this.view === 'week') {
			next = addDays(d, 7);
		} else {
			next = addDays(d, 1);
		}
		this.setDate(next);
	};

	goToToday = (): void => {
		this.setDate(new Date());
	};

	/* ── View dropdown ── */

	toggleViewDropdown = (): void => {
		this.isViewDropdownOpen = !this.isViewDropdownOpen;
	};

	setView = (view: CalendarViewMode): void => {
		this.view = view;
		this.isViewDropdownOpen = false;
		this._hasScrolledToTime = false;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:view-change', {
				bubbles: true,
				composed: true,
				detail: { view }
			})
		);
	};

	/* ── Event handlers ── */

	handleEventClick = (event: CalendarEvent): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:event-click', {
				bubbles: true,
				composed: true,
				detail: { event }
			})
		);
	};

	handleDateClick = (iso: string): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:date-click', {
				bubbles: true,
				composed: true,
				detail: { date: iso }
			})
		);
	};

	handleAddEvent = (): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:add-event', {
				bubbles: true,
				composed: true,
				detail: {}
			})
		);
	};

	handleAddEventOnDate = (iso: string): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:add-event', {
				bubbles: true,
				composed: true,
				detail: { date: iso }
			})
		);
	};

	showMoreEvents = (iso: string): void => {
		// Switch to day view for the date
		this.date = iso;
		this.setView('day');
	};

	/* ── Mini calendar handlers ── */

	miniCalPrevMonth = (): void => {
		if (this._miniCalMonth === 0) {
			this._miniCalMonth = 11;
			this._miniCalYear--;
		} else {
			this._miniCalMonth--;
		}
	};

	miniCalNextMonth = (): void => {
		if (this._miniCalMonth === 11) {
			this._miniCalMonth = 0;
			this._miniCalYear++;
		} else {
			this._miniCalMonth++;
		}
	};

	handleMiniCalSelect = (iso: string): void => {
		this.setDate(parseDate(iso));
	};

	/* ── Private helpers ── */

	private setDate(d: Date): void {
		this.date = toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
		this._miniCalYear = d.getFullYear();
		this._miniCalMonth = d.getMonth();
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:date-change', {
				bubbles: true,
				composed: true,
				detail: { date: this.date }
			})
		);
	}
}
