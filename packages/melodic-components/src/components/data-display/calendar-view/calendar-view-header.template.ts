import { html, when, classMap } from '@melodicdev/core';
import type { CalendarViewComponent } from './calendar-view.component.js';

const VIEW_LABELS: Record<string, string> = {
	month: 'Month view',
	week: 'Week view',
	day: 'Day view'
};

function renderDefaultHeaderLeft(c: CalendarViewComponent) {
	return html`
		<div class="ml-cv__today-badge">
			<span class="ml-cv__today-badge-month">${c.todayMonthAbbrev}</span>
			<span class="ml-cv__today-badge-day">${c.todayDayNumber}</span>
		</div>
		<div class="ml-cv__title-group">
			<div class="ml-cv__title-row">
				<h2 class="ml-cv__title">${c.headerTitle}</h2>
				${when(c.view !== 'day', () => html` <span class="ml-cv__week-badge">Week ${c.weekNumber}</span> `)}
			</div>
			<span class="ml-cv__subtitle">${c.headerSubtitle}</span>
		</div>
	`;
}

function renderDefaultHeaderActions(c: CalendarViewComponent) {
	return html`
		${when(
			!c.hideNav,
			() => html`
				<div class="ml-cv__nav-group">
					<button type="button" class="ml-cv__nav-btn" aria-label="Previous" @click=${c.navigatePrev}>
						<ml-icon icon="caret-left" size="sm"></ml-icon>
					</button>
					<button type="button" class="ml-cv__nav-btn" aria-label="Next" @click=${c.navigateNext}>
						<ml-icon icon="caret-right" size="sm"></ml-icon>
					</button>
				</div>
			`
		)}

		${when(
			!c.hideTodayButton,
			() => html`<button type="button" class="ml-cv__today-btn" @click=${c.goToToday}>Today</button>`
		)}

		${when(
			!c.hideViewSelector,
			() => html`
				<div class="ml-cv__view-dropdown">
					<button
						type="button"
						class=${classMap({
							'ml-cv__view-trigger': true,
							'ml-cv__view-trigger--open': c.isViewDropdownOpen
						})}
						@click=${c.toggleViewDropdown}
					>
						${VIEW_LABELS[c.view]}
						<ml-icon icon="caret-down" size="xs"></ml-icon>
					</button>
					${when(
						c.isViewDropdownOpen,
						() => html`
							<div class="ml-cv__view-menu">
								<button
									type="button"
									class=${classMap({ 'ml-cv__view-option': true, 'ml-cv__view-option--active': c.view === 'month' })}
									@click=${() => c.setView('month')}
								>
									Month view
								</button>
								<button
									type="button"
									class=${classMap({ 'ml-cv__view-option': true, 'ml-cv__view-option--active': c.view === 'week' })}
									@click=${() => c.setView('week')}
								>
									Week view
								</button>
								<button
									type="button"
									class=${classMap({ 'ml-cv__view-option': true, 'ml-cv__view-option--active': c.view === 'day' })}
									@click=${() => c.setView('day')}
								>
									Day view
								</button>
							</div>
						`
					)}
				</div>
			`
		)}

		${when(
			!c.hideAddButton,
			() => html`
				<button type="button" class="ml-cv__add-btn" @click=${c.handleAddEvent}>
					<ml-icon icon="plus" size="xs"></ml-icon>
					${c.addButtonText}
				</button>
			`
		)}
	`;
}

export function renderHeader(c: CalendarViewComponent) {
	return html`
		<div class="ml-cv__header">
			<div class="ml-cv__header-left">
				${when(c.hasHeaderLeftSlot, () => html`<slot name="header-left"></slot>`, () => renderDefaultHeaderLeft(c))}
			</div>

			<div class="ml-cv__header-right">
				${when(c.hasHeaderActionsSlot, () => html`<slot name="header-actions"></slot>`, () => renderDefaultHeaderActions(c))}
			</div>
		</div>
	`;
}
