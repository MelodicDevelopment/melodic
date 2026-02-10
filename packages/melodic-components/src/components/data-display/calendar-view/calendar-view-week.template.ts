import { html, repeat, classMap } from '@melodicdev/core';
import type { CalendarViewComponent } from './calendar-view.component.js';
import type { CalendarTimeColumn, PositionedEvent } from './calendar-view.types.js';
import { formatTime, TOTAL_ROWS } from './calendar-view.utils.js';

function renderTimeEvent(c: CalendarViewComponent, pe: PositionedEvent, colIndex: number) {
	const color = pe.event.color || 'blue';
	return html`
		<div
			class=${classMap({
				'ml-cv__time-event': true,
				[`ml-cv__time-event--${color}`]: true
			})}
			style="grid-row: ${pe.gridRowStart} / ${pe.gridRowEnd}; grid-column: ${colIndex + 2}; margin-left: ${pe.left * 100}%; width: ${pe.width * 100}%;"
			@click=${(e: Event) => { e.stopPropagation(); c.handleEventClick(pe.event); }}
		>
			<div class="ml-cv__time-event-title">${pe.event.title}</div>
			<div class="ml-cv__time-event-time">${formatTime(pe.event.start)} – ${formatTime(pe.event.end)}</div>
		</div>
	`;
}

export function renderWeekView(c: CalendarViewComponent) {
	const columns = c.weekColumns;
	const timeSlots = c.timeSlots;

	return html`
		<div class="ml-cv__time-layout">
			<div class="ml-cv__time-header ml-cv__time-header--week">
				<div class="ml-cv__time-header-gutter"></div>
				${repeat(columns, (col: CalendarTimeColumn) => col.date, (col: CalendarTimeColumn) => html`
					<div class=${classMap({
						'ml-cv__time-header-day': true,
						'ml-cv__time-header-day--today': col.isToday
					})}>
						<span class="ml-cv__time-header-label">${col.dayLabel}</span>
						<span class="ml-cv__time-header-number">${col.dayNumber}</span>
					</div>
				`)}
			</div>

			<div class="ml-cv__time-scroll">
				<div class="ml-cv__time-body ml-cv__time-body--week" style="--cv-rows: ${TOTAL_ROWS};">
					<!-- Time gutter column -->
					<div class="ml-cv__time-gutter" style="grid-row: 1 / ${TOTAL_ROWS + 1}; grid-column: 1;"></div>

					<!-- Day columns (background grid lines) -->
					${repeat(columns, (col: CalendarTimeColumn) => col.date, (_col: CalendarTimeColumn, colIdx: number) => html`
						<div
							class=${classMap({ 'ml-cv__time-column': true, 'ml-cv__time-column--last': colIdx === 6 })}
							style="grid-row: 1 / ${TOTAL_ROWS + 1}; grid-column: ${colIdx + 2};"
						></div>
					`)}

					<!-- Row grid lines -->
					${repeat(timeSlots, (_slot: { label: string; hour: number; minute: number }, i: number) => `row-${i}`, (_: { label: string; hour: number; minute: number }, i: number) => html`
						<div class="ml-cv__time-row" style="grid-row: ${i + 1}; grid-column: 1 / ${columns.length + 2};"></div>
					`)}

					<!-- Time slot labels in gutter -->
					${repeat(timeSlots, (_slot: { label: string; hour: number; minute: number }, i: number) => `label-${i}`, (slot: { label: string; hour: number; minute: number }, i: number) => html`
						<div class="ml-cv__time-label" style="grid-row: ${i + 1}; grid-column: 1;">${slot.label}</div>
					`)}

					<!-- Events placed on the grid -->
					${repeat(
						columns.flatMap((col: CalendarTimeColumn, colIdx: number) =>
							col.events.map((pe: PositionedEvent) => ({ pe, colIdx }))
						),
						(entry: { pe: PositionedEvent; colIdx: number }) => entry.pe.event.id,
						(entry: { pe: PositionedEvent; colIdx: number }) => renderTimeEvent(c, entry.pe, entry.colIdx)
					)}
				</div>
			</div>
		</div>
	`;
}
