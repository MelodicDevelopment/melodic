import { html, classMap, repeat } from '@melodicdev/core';
import type { CalendarComponent, CalendarDay } from './calendar.component.js';

export function calendarTemplate(c: CalendarComponent) {
	return html`
		<div class="ml-calendar" role="grid" aria-label=${c.monthLabel}>
			<div class="ml-calendar__header">
				<div class="ml-calendar__nav-group">
					<button type="button" class="ml-calendar__nav" aria-label="Previous year" @click=${c.prevYear}>
						<ml-icon icon="caret-double-left" size="sm"></ml-icon>
					</button>
					<button type="button" class="ml-calendar__nav" aria-label="Previous month" @click=${c.prevMonth}>
						<ml-icon icon="caret-left" size="sm"></ml-icon>
					</button>
				</div>
				<span class="ml-calendar__month-label">${c.monthLabel}</span>
				<div class="ml-calendar__nav-group">
					<button type="button" class="ml-calendar__nav" aria-label="Next month" @click=${c.nextMonth}>
						<ml-icon icon="caret-right" size="sm"></ml-icon>
					</button>
					<button type="button" class="ml-calendar__nav" aria-label="Next year" @click=${c.nextYear}>
						<ml-icon icon="caret-double-right" size="sm"></ml-icon>
					</button>
				</div>
			</div>

			<div class="ml-calendar__weekdays" role="row">
				${repeat(c.weekdays, (d: string) => d, (d: string) => html`
					<span class="ml-calendar__weekday" role="columnheader">${d}</span>
				`)}
			</div>

			<div class="ml-calendar__grid">
				${repeat(c.days, (day: CalendarDay) => day.iso, (day: CalendarDay) => html`
					<button
						type="button"
						class=${classMap({
							'ml-calendar__day': true,
							'ml-calendar__day--other-month': !day.isCurrentMonth,
							'ml-calendar__day--today': day.isToday,
							'ml-calendar__day--selected': day.isSelected,
							'ml-calendar__day--disabled': day.isDisabled
						})}
						?disabled=${day.isDisabled || !day.isCurrentMonth}
						tabindex=${day.isCurrentMonth ? '0' : '-1'}
						aria-selected=${day.isSelected ? 'true' : 'false'}
						aria-label=${day.iso}
						@click=${() => c.selectDay(day)}
					>
						<span class="ml-calendar__day-number">${day.date}</span>
						${day.isToday ? html`<span class="ml-calendar__today-dot"></span>` : ''}
					</button>
				`)}
			</div>

			<div class="ml-calendar__footer">
				<button type="button" class="ml-calendar__today-btn" @click=${c.goToToday}>Today</button>
			</div>
		</div>
	`;
}
