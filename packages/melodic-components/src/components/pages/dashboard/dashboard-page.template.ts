import { html, classMap, when } from '@melodicdev/core';
import type { DashboardPageComponent } from './dashboard-page.component.js';

export function dashboardPageTemplate(c: DashboardPageComponent) {
	const showAside = c.layout === 'default' && c.hasAside;

	return html`
		<ml-app-shell>
			<slot name="sidebar" slot="sidebar"></slot>

			<ml-page-header
				slot="header"
				title=${c.title}
				description=${c.description}
			>
				${when(c.hasHeaderActions, () => html`
					<slot name="header-actions" slot="actions"></slot>
				`)}
			</ml-page-header>

			<div
				class=${classMap({
					'ml-dashboard': true,
					[`ml-dashboard--${c.layout}`]: true
				})}
			>
				${when(c.hasMetrics, () => html`
					<div class="ml-dashboard__metrics">
						<slot name="metrics"></slot>
					</div>
				`)}

				<div class="ml-dashboard__body">
					<div class="ml-dashboard__main">
						<slot name="main"></slot>
					</div>

					${when(showAside, () => html`
						<div class="ml-dashboard__aside">
							<slot name="aside"></slot>
						</div>
					`)}
				</div>
			</div>
		</ml-app-shell>
	`;
}
