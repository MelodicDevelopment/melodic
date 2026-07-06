import type { CalendarEvent, CalendarDayCell, CalendarTimeColumn, PositionedEvent } from './calendar-view.types.js';

const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_ABBREVS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** 30-minute time slots = 48 rows for 24 hours */
export const TIME_INCREMENT = 30;
export const TOTAL_ROWS = 48;

export function toIsoDate(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseDate(iso: string): Date {
	const [y, m, d] = iso.split('T')[0].split('-').map(Number);
	return new Date(y, m - 1, d);
}

/**
 * Parse an event timestamp on the single timezone basis the calendar uses
 * everywhere: LOCAL time. Full timestamps go through `new Date(iso)` so any
 * offset/Z suffix is honored and converted to local time; date-only strings
 * are treated as local midnight (never `new Date('YYYY-MM-DD')`, which is UTC
 * midnight and shifts a day in negative-offset timezones).
 */
export function parseEventDate(iso: string): Date {
	return iso.includes('T') ? new Date(iso) : parseDate(iso);
}

/** Local-time calendar date (YYYY-MM-DD) of an event timestamp. */
export function toLocalIsoDate(date: Date): string {
	return toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isToday(date: Date): boolean {
	return isSameDay(date, new Date());
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function addMonths(date: Date, months: number): Date {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
}

export function startOfWeek(date: Date, weekStartsOn: number = 0): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = (day - weekStartsOn + 7) % 7;
	d.setDate(d.getDate() - diff);
	return d;
}

export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getISOWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function formatTime(iso: string): string {
	const date = parseEventDate(iso);
	const h = date.getHours();
	const m = date.getMinutes();
	const ampm = h >= 12 ? 'PM' : 'AM';
	const hour = h % 12 || 12;
	return m === 0 ? `${hour} ${ampm}` : `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function formatMonthYear(date: Date): string {
	return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateRange(start: Date, end: Date): string {
	const sMonth = MONTH_ABBREVS[start.getMonth()];
	const eMonth = MONTH_ABBREVS[end.getMonth()];
	if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
		return `${sMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
	}
	if (start.getFullYear() === end.getFullYear()) {
		return `${sMonth} ${start.getDate()} – ${eMonth} ${end.getDate()}, ${start.getFullYear()}`;
	}
	return `${sMonth} ${start.getDate()}, ${start.getFullYear()} – ${eMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export function getMonthGrid(year: number, month: number, weekStartsOn: number = 0): CalendarDayCell[] {
	const firstDay = new Date(year, month, 1);
	const firstDayOfWeek = firstDay.getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const daysInPrevMonth = new Date(year, month, 0).getDate();
	const today = new Date();
	const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

	const result: CalendarDayCell[] = [];

	// Leading days from previous month
	const offset = (firstDayOfWeek - weekStartsOn + 7) % 7;
	const prevMonth = month === 0 ? 11 : month - 1;
	const prevYear = month === 0 ? year - 1 : year;
	for (let i = offset - 1; i >= 0; i--) {
		const d = daysInPrevMonth - i;
		const iso = toIsoDate(prevYear, prevMonth, d);
		result.push({
			date: d, month: prevMonth, year: prevYear, iso,
			isCurrentMonth: false,
			isToday: iso === todayIso,
			events: []
		});
	}

	// Current month days
	for (let d = 1; d <= daysInMonth; d++) {
		const iso = toIsoDate(year, month, d);
		result.push({
			date: d, month, year, iso,
			isCurrentMonth: true,
			isToday: iso === todayIso,
			events: []
		});
	}

	// Trailing days to complete rows
	const totalNeeded = Math.ceil(result.length / 7) * 7;
	const nextMonth = month === 11 ? 0 : month + 1;
	const nextYear = month === 11 ? year + 1 : year;
	for (let t = 1; result.length < totalNeeded; t++) {
		const iso = toIsoDate(nextYear, nextMonth, t);
		result.push({
			date: t, month: nextMonth, year: nextYear, iso,
			isCurrentMonth: false,
			isToday: iso === todayIso,
			events: []
		});
	}

	return result;
}

export function getWeekDays(date: Date, weekStartsOn: number = 0): Date[] {
	const start = startOfWeek(date, weekStartsOn);
	return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getWeekdayHeaders(weekStartsOn: number = 0): { short: string; full: string }[] {
	return Array.from({ length: 7 }, (_, i) => {
		const idx = (weekStartsOn + i) % 7;
		return { short: DAY_ABBREVS[idx], full: DAY_NAMES[idx] };
	});
}

export function getEventsForDate(events: CalendarEvent[], iso: string): CalendarEvent[] {
	// Bucket by the event's LOCAL calendar date — the same basis used to render
	// its time — so a `…T23:00:00Z` event never lands on its UTC date while
	// displaying a local-shifted time on the wrong day.
	return events.filter(e => toLocalIsoDate(parseEventDate(e.start)) === iso);
}

export function getMonthAbbrev(date: Date): string {
	return MONTH_ABBREVS[date.getMonth()];
}

export function getDayAbbrev(date: Date): string {
	return DAY_ABBREVS[date.getDay()];
}

export function getDayName(date: Date): string {
	return DAY_NAMES[date.getDay()];
}

/** Convert minutes from midnight to a 1-based grid row (30-min increments, 48 rows) */
function minutesToGridRow(minutes: number): number {
	return Math.floor(minutes / TIME_INCREMENT) + 1;
}

/**
 * An event's in-day occupancy in local minutes from midnight.
 *
 * Events that cross midnight (or otherwise end on a later local day than they
 * start) are clamped to the end of the start day, so grid spans stay valid
 * (gridRowEnd >= gridRowStart) and column packing sees real occupancy instead
 * of an end that is numerically before the start. Degenerate/reversed inputs
 * within one day are clamped to a minimum positive span.
 */
function getEventSpan(event: CalendarEvent): { start: number; end: number } {
	const startDate = parseEventDate(event.start);
	const endDate = parseEventDate(event.end);
	const start = startDate.getHours() * 60 + startDate.getMinutes();
	let end = endDate.getHours() * 60 + endDate.getMinutes();

	if (!isSameDay(startDate, endDate)) {
		end = 24 * 60;
	}

	return { start, end: Math.max(end, start + 1) };
}

export function layoutOverlappingEvents(events: CalendarEvent[]): PositionedEvent[] {
	if (events.length === 0) return [];

	const spans = new Map<string, { start: number; end: number }>();
	for (const event of events) {
		spans.set(event.id, getEventSpan(event));
	}
	const spanOf = (event: CalendarEvent) => spans.get(event.id)!;

	const sorted = [...events].sort((a, b) => {
		const aSpan = spanOf(a);
		const bSpan = spanOf(b);
		if (aSpan.start !== bSpan.start) return aSpan.start - bSpan.start;
		return (bSpan.end - bSpan.start) - (aSpan.end - aSpan.start);
	});

	const columns: { end: number }[][] = [];
	const eventColumns: Map<string, number> = new Map();

	for (const event of sorted) {
		const { start, end } = spanOf(event);

		let placed = false;
		for (let col = 0; col < columns.length; col++) {
			const lastInCol = columns[col][columns[col].length - 1];
			if (lastInCol.end <= start) {
				columns[col].push({ end });
				eventColumns.set(event.id, col);
				placed = true;
				break;
			}
		}
		if (!placed) {
			columns.push([{ end }]);
			eventColumns.set(event.id, columns.length - 1);
		}
	}

	// Group overlapping events to determine totalColumns per group
	const groups: { events: CalendarEvent[]; totalColumns: number }[] = [];
	const visited = new Set<string>();

	for (const event of sorted) {
		if (visited.has(event.id)) continue;

		const group: CalendarEvent[] = [event];
		visited.add(event.id);
		let groupEnd = spanOf(event).end;
		let maxCol = eventColumns.get(event.id)! + 1;

		for (const other of sorted) {
			if (visited.has(other.id)) continue;
			const otherSpan = spanOf(other);
			if (otherSpan.start < groupEnd) {
				group.push(other);
				visited.add(other.id);
				groupEnd = Math.max(groupEnd, otherSpan.end);
				maxCol = Math.max(maxCol, eventColumns.get(other.id)! + 1);
			}
		}

		groups.push({ events: group, totalColumns: maxCol });
	}

	const result: PositionedEvent[] = [];

	for (const group of groups) {
		for (const event of group.events) {
			const { start, end } = spanOf(event);
			const col = eventColumns.get(event.id)!;
			const total = group.totalColumns;

			const gridRowStart = minutesToGridRow(start);
			const gridRowEnd = Math.max(minutesToGridRow(end), gridRowStart + 1);

			result.push({
				event,
				gridRowStart,
				gridRowEnd,
				left: col / total,
				width: 1 / total
			});
		}
	}

	return result;
}

export function getTimeSlots(): { label: string; hour: number; minute: number }[] {
	const slots: { label: string; hour: number; minute: number }[] = [];
	for (let h = 0; h < 24; h++) {
		for (let m = 0; m < 60; m += TIME_INCREMENT) {
			const ampm = h >= 12 ? 'PM' : 'AM';
			const hour = h % 12 || 12;
			const label = m === 0 ? `${hour} ${ampm}` : '';
			slots.push({ label, hour: h, minute: m });
		}
	}
	return slots;
}

export function getWeekColumns(date: Date, weekStartsOn: number, events: CalendarEvent[]): CalendarTimeColumn[] {
	const days = getWeekDays(date, weekStartsOn);
	return days.map(d => {
		const iso = toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
		const dayEvents = getEventsForDate(events, iso).filter(e => !e.allDay);
		return {
			date: iso,
			dayLabel: DAY_ABBREVS[d.getDay()],
			dayNumber: d.getDate(),
			isToday: isToday(d),
			events: layoutOverlappingEvents(dayEvents)
		};
	});
}

export function getDayColumn(date: Date, events: CalendarEvent[]): CalendarTimeColumn {
	const iso = toIsoDate(date.getFullYear(), date.getMonth(), date.getDate());
	const dayEvents = getEventsForDate(events, iso).filter(e => !e.allDay);
	return {
		date: iso,
		dayLabel: DAY_ABBREVS[date.getDay()],
		dayNumber: date.getDate(),
		isToday: isToday(date),
		events: layoutOverlappingEvents(dayEvents)
	};
}

export function getMiniCalendarDots(year: number, month: number, events: CalendarEvent[]): Set<string> {
	const dots = new Set<string>();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	for (let d = 1; d <= daysInMonth; d++) {
		const iso = toIsoDate(year, month, d);
		if (events.some(e => toLocalIsoDate(parseEventDate(e.start)) === iso)) {
			dots.add(iso);
		}
	}
	return dots;
}
