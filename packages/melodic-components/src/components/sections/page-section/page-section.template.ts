import { html, classMap, when } from '@melodicdev/core';
import type { PageSectionComponent } from './page-section.component.js';
import { sanitizeHref } from './sanitize-href.function.js';

/**
 * The header (and its action slot) is always rendered so `slotchange` fires
 * when action content is added or removed after mount (see
 * PageSectionComponent.onCreate). An empty header is hidden via the
 * `--hidden` modifier instead of being omitted.
 */
export function pageSectionTemplate(c: PageSectionComponent) {
	const showHeader = !!(c.sectionTitle || c.subtitle || c.actionLabel || c.hasAction);

	return html`
		<section class=${classMap({
			'ml-page-section': true,
			[`ml-page-section--pad-${c.padding}`]: true
		})}>
			<div class=${classMap({
				'ml-page-section__header': true,
				'ml-page-section__header--hidden': !showHeader
			})}>
				<div class="ml-page-section__heading">
					${when(!!c.sectionTitle, () => html`
						<h2 class="ml-page-section__title">${c.sectionTitle}</h2>
					`)}
					${when(!!c.subtitle, () => html`
						<p class="ml-page-section__subtitle">${c.subtitle}</p>
					`)}
				</div>
				<div class="ml-page-section__action">
					<slot name="action">
						${when(!!c.actionLabel, () => html`
							<a class="ml-page-section__action-link" href=${sanitizeHref(c.actionHref)}>${c.actionLabel}</a>
						`)}
					</slot>
				</div>
			</div>
			<div class="ml-page-section__content">
				<slot></slot>
			</div>
		</section>
	`;
}
