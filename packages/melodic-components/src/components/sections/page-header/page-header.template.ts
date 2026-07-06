import { html, classMap, when } from '@melodicdev/core';
import type { PageHeaderComponent } from './page-header.component.js';

/**
 * All named slots are always rendered so `slotchange` fires when content is
 * added or removed after mount (see PageHeaderComponent.onCreate). Empty
 * sections are hidden via the `--empty` modifier instead of being omitted.
 */
export function pageHeaderTemplate(c: PageHeaderComponent) {
	const hasTitle = !!(c.headerTitle || c.hasTitleSlot);
	const hasDescription = !!(c.description || c.hasDescriptionSlot);

	return html`
		<header
			class=${classMap({
				'ml-page-header': true,
				[`ml-page-header--${c.variant}`]: true,
				'ml-page-header--divider': c.divider
			})}
		>
			<div class=${classMap({
				'ml-page-header__breadcrumb': true,
				'ml-page-header__section--empty': !c.hasBreadcrumb
			})}>
				<slot name="breadcrumb"></slot>
			</div>

			<div class="ml-page-header__main">
				<div class="ml-page-header__content">
					<div class=${classMap({
						'ml-page-header__title': true,
						'ml-page-header__section--empty': !hasTitle
					})}>
						<slot name="title">${when(!!c.headerTitle, () => html`<h1>${c.headerTitle}</h1>`)}</slot>
					</div>

					<div class=${classMap({
						'ml-page-header__description': true,
						'ml-page-header__section--empty': !hasDescription
					})}>
						<slot name="description">${when(!!c.description, () => html`<p>${c.description}</p>`)}</slot>
					</div>

					<div class=${classMap({
						'ml-page-header__meta': true,
						'ml-page-header__section--empty': !c.hasMeta
					})}>
						<slot name="meta"></slot>
					</div>
				</div>

				<div class=${classMap({
					'ml-page-header__actions': true,
					'ml-page-header__section--empty': !c.hasActions
				})}>
					<slot name="actions"></slot>
				</div>
			</div>

			<div class=${classMap({
				'ml-page-header__tabs': true,
				'ml-page-header__section--empty': !c.hasTabs
			})}>
				<slot name="tabs"></slot>
			</div>
		</header>
	`;
}
