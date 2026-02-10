import { html, repeat, when, classMap } from '@melodicdev/core';
import type { CalendarViewComponent } from './calendar-view.component.js';
import type { CalendarDayCell, CalendarEvent } from './calendar-view.types.js';
import { formatTime } from './calendar-view.utils.js';

function renderEventPill(c: CalendarViewComponent, event: CalendarEvent) {
	const color = event.color || 'blue';
	return html`
		<div
			class=${classMap({
				'ml-cv__event-pill': true,
				[`ml-cv__event-pill--${color}`]: true
			})}
			@click=${(e: Event) => { e.stopPropagation(); c.handleEventClick(event); }}
		>
			${when(!event.allDay, () => html`
				<span class="ml-cv__event-pill-time">${formatTime(event.start)}</span>
			`)}
			<span class="ml-cv__event-pill-title">${event.title}</span>
		</div>
	`;
}

export function renderMonthView(c: CalendarViewComponent) {
	const headers = c.weekdayHeaders;
	const grid = c.monthGrid;
	const today = new Date();
	const todayDayIndex = today.getDay();
	const weekStartsOn = c.weekStartsOn;

	return html`
		<div class="ml-cv__month">
			<div class="ml-cv__weekday-header">
				${repeat(headers, (h: { short: string; full: string }) => h.short, (h: { short: string; full: string }, i: number) => {
					const dayIndex = (weekStartsOn + i) % 7;
					return html`
						<div class=${classMap({
							'ml-cv__weekday': true,
							'ml-cv__weekday--today': dayIndex === todayDayIndex
						})}>${h.short}</div>
					`;
				})}
			</div>

			<div class="ml-cv__month-grid">
				${repeat(grid, (day: CalendarDayCell) => day.iso, (day: CalendarDayCell) => {
					const visible = day.events.slice(0, c.maxVisibleEvents);
					const overflow = day.events.length - c.maxVisibleEvents;

					return html`
						<div
							class=${classMap({
								'ml-cv__day-cell': true,
								'ml-cv__day-cell--other-month': !day.isCurrentMonth
							})}
							@click=${() => c.handleDateClick(day.iso)}
						>
							<div class=${classMap({
								'ml-cv__day-number': true,
								'ml-cv__day-number--today': day.isToday
							})}>${day.date}</div>

							<div class="ml-cv__day-events">
								${repeat(visible, (e: CalendarEvent) => e.id, (e: CalendarEvent) => renderEventPill(c, e))}
								${when(overflow > 0, () => html`
									<button
										type="button"
										class="ml-cv__more-link"
										@click=${(e: Event) => { e.stopPropagation(); c.showMoreEvents(day.iso); }}
									>${overflow} more...</button>
								`)}
							</div>

							<button
								type="button"
								class="ml-cv__day-add"
								aria-label="Add event"
								@click=${(e: Event) => { e.stopPropagation(); c.handleAddEventOnDate(day.iso); }}
							>+</button>
						</div>
					`;
				})}
			</div>
		</div>
	`;
}
