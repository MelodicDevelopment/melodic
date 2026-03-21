import { html, classMap, when } from '@melodicdev/core';
import type { PageSectionComponent } from './page-section.component.js';

export function pageSectionTemplate(c: PageSectionComponent) {
	return html`
		<section class=${classMap({
			'ml-page-section': true,
			[`ml-page-section--pad-${c.padding}`]: true
		})}>
			${when(!!c.title, () => html`
				<div class="ml-page-section__header">
					<div class="ml-page-section__heading">
						<h2 class="ml-page-section__title">${c.title}</h2>
						${when(!!c.subtitle, () => html`
							<p class="ml-page-section__subtitle">${c.subtitle}</p>
						`)}
					</div>
					<div class="ml-page-section__action">
						<slot name="action">
							${when(!!c['action-label'], () => html`
								<a class="ml-page-section__action-link" href=${c['action-href']}>${c['action-label']}</a>
							`)}
						</slot>
					</div>
				</div>
			`)}
			<div class="ml-page-section__content">
				<slot></slot>
			</div>
		</section>
	`;
}
