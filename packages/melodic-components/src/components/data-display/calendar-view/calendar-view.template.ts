import { html, when } from '@melodicdev/core';
import type { CalendarViewComponent } from './calendar-view.component.js';
import { renderHeader } from './calendar-view-header.template.js';
import { renderMonthView } from './calendar-view-month.template.js';
import { renderWeekView } from './calendar-view-week.template.js';
import { renderDayView } from './calendar-view-day.template.js';

export function calendarViewTemplate(c: CalendarViewComponent) {
	return html`
		<div class="ml-cv">
			${renderHeader(c)}
			${when(c.view === 'month', () => renderMonthView(c))}
			${when(c.view === 'week', () => renderWeekView(c))}
			${when(c.view === 'day', () => renderDayView(c))}
		</div>
	`;
}
