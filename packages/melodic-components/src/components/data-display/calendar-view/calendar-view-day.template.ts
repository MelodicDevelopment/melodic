import { html, repeat, when, classMap } from '@melodicdev/core';
import type { CalendarViewComponent } from './calendar-view.component.js';
import type { CalendarDayCell, CalendarEvent, PositionedEvent } from './calendar-view.types.js';
import { formatTime, TOTAL_ROWS } from './calendar-view.utils.js';

function renderTimeEvent(c: CalendarViewComponent, pe: PositionedEvent) {
	const color = pe.event.color || 'blue';
	return html`
		<div
			class=${classMap({
				'ml-cv__time-event': true,
				[`ml-cv__time-event--${color}`]: true
			})}
			style="grid-row: ${pe.gridRowStart} / ${pe.gridRowEnd}; grid-column: 2; margin-left: ${pe.left * 100}%; width: ${pe.width * 100}%;"
			@click=${(e: Event) => { e.stopPropagation(); c.handleEventClick(pe.event); }}
		>
			<div class="ml-cv__time-event-title">${pe.event.title}</div>
			<div class="ml-cv__time-event-time">${formatTime(pe.event.start)} – ${formatTime(pe.event.end)}</div>
		</div>
	`;
}

function renderMiniCalendar(c: CalendarViewComponent) {
	const miniGrid = c.miniCalendarGrid;
	const miniHeaders = c.miniCalendarWeekdays;
	const dots = c.miniCalendarDots;
	const selectedIso = c.currentIsoDate;

	return html`
		<div class="ml-cv__mini-cal">
			<div class="ml-cv__mini-cal-header">
				<span class="ml-cv__mini-cal-title">${c.miniCalendarTitle}</span>
				<div class="ml-cv__mini-cal-nav">
					<button type="button" class="ml-cv__mini-cal-btn" aria-label="Previous month" @click=${c.miniCalPrevMonth}>
						<ml-icon icon="caret-left" size="xs"></ml-icon>
					</button>
					<button type="button" class="ml-cv__mini-cal-btn" aria-label="Next month" @click=${c.miniCalNextMonth}>
						<ml-icon icon="caret-right" size="xs"></ml-icon>
					</button>
				</div>
			</div>

			<div class="ml-cv__mini-cal-weekdays">
				${repeat(miniHeaders, (h: string) => h, (h: string) => html`
					<div class="ml-cv__mini-cal-weekday">${h}</div>
				`)}
			</div>

			<div class="ml-cv__mini-cal-grid">
				${repeat(miniGrid, (day: CalendarDayCell) => day.iso, (day: CalendarDayCell) => html`
					<button
						type="button"
						class=${classMap({
							'ml-cv__mini-cal-day': true,
							'ml-cv__mini-cal-day--other': !day.isCurrentMonth,
							'ml-cv__mini-cal-day--today': day.isToday,
							'ml-cv__mini-cal-day--selected': day.iso === selectedIso
						})}
						@click=${() => c.handleMiniCalSelect(day.iso)}
					>
						${day.date}
						${when(dots.has(day.iso), () => html`<span class="ml-cv__mini-cal-dot"></span>`)}
					</button>
				`)}
			</div>
		</div>
	`;
}

function renderSidebarEvents(c: CalendarViewComponent) {
	const events = c.dayEvents;

	return html`
		<div class="ml-cv__sidebar-title">Events for ${c.dayViewDateLabel}</div>
		${when(events.length === 0, () => html`
			<div class="ml-cv__sidebar-empty">No events scheduled</div>
		`)}
		${when(events.length > 0, () => html`
			<div class="ml-cv__sidebar-events">
				${repeat(events, (e: CalendarEvent) => e.id, (e: CalendarEvent) => {
					const color = e.color || 'blue';
					return html`
						<div class="ml-cv__sidebar-event" @click=${() => c.handleEventClick(e)}>
							<div class=${`ml-cv__sidebar-event-bar ml-cv__sidebar-event-bar--${color}`}></div>
							<div class="ml-cv__sidebar-event-content">
								<div class="ml-cv__sidebar-event-title">${e.title}</div>
								<div class="ml-cv__sidebar-event-time">
									${e.allDay ? 'All day' : `${formatTime(e.start)} – ${formatTime(e.end)}`}
								</div>
							</div>
						</div>
					`;
				})}
			</div>
		`)}
	`;
}

export function renderDayView(c: CalendarViewComponent) {
	const column = c.dayColumn;
	const timeSlots = c.timeSlots;

	return html`
		<div class="ml-cv__day-layout">
			<div class="ml-cv__day-main">
				<div class="ml-cv__time-layout">
					<div class="ml-cv__time-header ml-cv__time-header--day">
						<div class="ml-cv__time-header-gutter"></div>
						<div class=${classMap({
							'ml-cv__time-header-day': true,
							'ml-cv__time-header-day--today': column.isToday
						})}>
							<span class="ml-cv__time-header-label">${column.dayLabel}</span>
							<span class="ml-cv__time-header-number">${column.dayNumber}</span>
						</div>
					</div>

					<div class="ml-cv__time-scroll">
						<div class="ml-cv__time-body ml-cv__time-body--day" style="--cv-rows: ${TOTAL_ROWS};">
							<!-- Time gutter column -->
							<div class="ml-cv__time-gutter" style="grid-row: 1 / ${TOTAL_ROWS + 1}; grid-column: 1;"></div>

							<!-- Day column background -->
							<div class="ml-cv__time-column" style="grid-row: 1 / ${TOTAL_ROWS + 1}; grid-column: 2;"></div>

							<!-- Row grid lines -->
							${repeat(timeSlots, (_slot: { label: string; hour: number; minute: number }, i: number) => `row-${i}`, (_: { label: string; hour: number; minute: number }, i: number) => html`
								<div class="ml-cv__time-row" style="grid-row: ${i + 1}; grid-column: 1 / 3;"></div>
							`)}

							<!-- Time slot labels -->
							${repeat(timeSlots, (_slot: { label: string; hour: number; minute: number }, i: number) => `label-${i}`, (slot: { label: string; hour: number; minute: number }, i: number) => html`
								<div class="ml-cv__time-label" style="grid-row: ${i + 1}; grid-column: 1;">${slot.label}</div>
							`)}

							<!-- Events -->
							${repeat(column.events, (pe: PositionedEvent) => pe.event.id, (pe: PositionedEvent) => renderTimeEvent(c, pe))}
						</div>
					</div>
				</div>
			</div>

			<div class="ml-cv__day-sidebar">
				${renderMiniCalendar(c)}
				${renderSidebarEvents(c)}
			</div>
		</div>
	`;
}
