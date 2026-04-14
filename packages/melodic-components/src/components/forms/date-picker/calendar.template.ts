import { html, classMap, repeat, when } from '@melodicdev/core';
import type { CalendarComponent, CalendarDay, CalendarMonth, CalendarYear } from './calendar.component.js';

function dayGrid(c: CalendarComponent) {
	return html`
		<div class="ml-calendar__weekdays" role="row">
			${repeat(c.weekdays, (d: string) => d, (d: string) => html`
				<span class="ml-calendar__weekday" role="columnheader">${d}</span>
			`)}
		</div>

		<div class="ml-calendar__grid" @keydown=${c.handleGridKeyDown}>
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
	`;
}

function monthGrid(c: CalendarComponent) {
	return html`
		<div class="ml-calendar__cell-grid" @keydown=${c.handleGridKeyDown}>
			${repeat(c.months, (m: CalendarMonth) => m.index, (m: CalendarMonth) => html`
				<button
					type="button"
					class=${classMap({
						'ml-calendar__cell': true,
						'ml-calendar__cell--selected': m.isSelected,
						'ml-calendar__cell--current': m.isCurrent,
						'ml-calendar__cell--disabled': m.isDisabled
					})}
					?disabled=${m.isDisabled}
					tabindex="0"
					aria-selected=${m.isSelected ? 'true' : 'false'}
					aria-label=${m.label}
					@click=${() => c.selectViewMonth(m)}
				>
					${m.label}
				</button>
			`)}
		</div>
	`;
}

function yearGrid(c: CalendarComponent) {
	return html`
		<div class="ml-calendar__cell-grid" @keydown=${c.handleGridKeyDown}>
			${repeat(c.years, (y: CalendarYear) => y.year, (y: CalendarYear) => html`
				<button
					type="button"
					class=${classMap({
						'ml-calendar__cell': true,
						'ml-calendar__cell--selected': y.isSelected,
						'ml-calendar__cell--current': y.isCurrent,
						'ml-calendar__cell--disabled': y.isDisabled
					})}
					?disabled=${y.isDisabled}
					tabindex=${y.isDisabled ? '-1' : '0'}
					aria-selected=${y.isSelected ? 'true' : 'false'}
					aria-label=${String(y.year)}
					@click=${() => c.selectViewYear(y)}
				>
					${y.year}
				</button>
			`)}
		</div>
	`;
}

export function calendarTemplate(c: CalendarComponent) {
	return html`
		<div class=${classMap({
			'ml-calendar': true,
			[`ml-calendar--view-${c.view}`]: true
		})} role="grid" aria-label=${c.headerLabel}>
			<div class="ml-calendar__header">
				<div class="ml-calendar__nav-group">
					<button type="button" class="ml-calendar__nav" aria-label="Previous" @click=${c.headerPrevFar}>
						<ml-icon icon="caret-double-left" size="sm"></ml-icon>
					</button>
					${when(c.view === 'day', () => html`
						<button type="button" class="ml-calendar__nav" aria-label="Previous month" @click=${c.prevMonth}>
							<ml-icon icon="caret-left" size="sm"></ml-icon>
						</button>
					`)}
				</div>

				${when(
					c.view === 'day',
					() => html`
						<div class="ml-calendar__title">
							<button
								type="button"
								class="ml-calendar__title-btn"
								aria-label="Select month"
								aria-expanded="false"
								@click=${c.openMonthView}
							>${c.monthLabel}</button>
							<button
								type="button"
								class="ml-calendar__title-btn"
								aria-label="Select year"
								aria-expanded="false"
								@click=${c.openYearView}
							>${c.viewYear}</button>
						</div>
					`,
					() => html`
						<button
							type="button"
							class="ml-calendar__title-btn ml-calendar__title-btn--wide"
							aria-label=${c.view === 'month' ? 'Back to day view' : 'Select year'}
							aria-expanded="true"
							@click=${c.view === 'month' ? c.openMonthView : c.openYearView}
						>${c.headerLabel}</button>
					`
				)}

				<div class="ml-calendar__nav-group">
					${when(c.view === 'day', () => html`
						<button type="button" class="ml-calendar__nav" aria-label="Next month" @click=${c.nextMonth}>
							<ml-icon icon="caret-right" size="sm"></ml-icon>
						</button>
					`)}
					<button type="button" class="ml-calendar__nav" aria-label="Next" @click=${c.headerNextFar}>
						<ml-icon icon="caret-double-right" size="sm"></ml-icon>
					</button>
				</div>
			</div>

			${when(c.view === 'day', () => dayGrid(c))}
			${when(c.view === 'month', () => monthGrid(c))}
			${when(c.view === 'year', () => yearGrid(c))}

			<div class="ml-calendar__footer">
				<button type="button" class="ml-calendar__today-btn" @click=${c.goToToday}>Today</button>
			</div>
		</div>
	`;
}
