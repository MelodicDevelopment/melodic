import { html, classMap, when } from '@melodicdev/core';
import type { PageHeaderComponent } from './page-header.component.js';

export function pageHeaderTemplate(c: PageHeaderComponent) {
	const hasTitle = !!(c.title || c.hasTitleSlot);
	const hasDescription = !!(c.description || c.hasDescriptionSlot);

	return html`
		<header
			class=${classMap({
				'ml-page-header': true,
				[`ml-page-header--${c.variant}`]: true,
				'ml-page-header--divider': c.divider
			})}
		>
			${when(c.hasBreadcrumb, () => html`
				<div class="ml-page-header__breadcrumb">
					<slot name="breadcrumb"></slot>
				</div>
			`)}

			<div class="ml-page-header__main">
				<div class="ml-page-header__content">
					${when(hasTitle, () => html`
						<div class="ml-page-header__title">
							${when(c.hasTitleSlot,
								() => html`<slot name="title"></slot>`,
								() => html`<h1>${c.title}</h1>`
							)}
						</div>
					`)}

					${when(hasDescription, () => html`
						<div class="ml-page-header__description">
							${when(c.hasDescriptionSlot,
								() => html`<slot name="description"></slot>`,
								() => html`<p>${c.description}</p>`
							)}
						</div>
					`)}

					${when(c.hasMeta, () => html`
						<div class="ml-page-header__meta">
							<slot name="meta"></slot>
						</div>
					`)}
				</div>

				${when(c.hasActions, () => html`
					<div class="ml-page-header__actions">
						<slot name="actions"></slot>
					</div>
				`)}
			</div>

			${when(c.hasTabs, () => html`
				<div class="ml-page-header__tabs">
					<slot name="tabs"></slot>
				</div>
			`)}
		</header>
	`;
}
