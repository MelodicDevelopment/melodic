export type CalendarViewMode = 'month' | 'week' | 'day';

export type CalendarEventColor = 'gray' | 'blue' | 'purple' | 'green' | 'pink' | 'orange' | 'yellow';

export interface CalendarEvent {
	id: string;
	title: string;
	start: string;
	end: string;
	color?: CalendarEventColor;
	allDay?: boolean;
	description?: string;
}

export interface CalendarDayCell {
	date: number;
	month: number;
	year: number;
	iso: string;
	isCurrentMonth: boolean;
	isToday: boolean;
	events: CalendarEvent[];
}

export interface CalendarTimeColumn {
	date: string;
	dayLabel: string;
	dayNumber: number;
	isToday: boolean;
	events: PositionedEvent[];
}

export interface PositionedEvent {
	event: CalendarEvent;
	gridRowStart: number;
	gridRowEnd: number;
	/** Fractional left offset within the column (0–1) for overlap tiling */
	left: number;
	/** Fractional width within the column (0–1) for overlap tiling */
	width: number;
}
