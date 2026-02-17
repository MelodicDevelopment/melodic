import { html, classMap, when } from '@melodicdev/core';
import type { HeroSectionComponent } from './hero-section.component.js';

export function heroSectionTemplate(c: HeroSectionComponent) {
	const isSplit = c.variant === 'split' || c.variant === 'split-reverse';

	return html`
		<section
			class=${classMap({
				'ml-hero': true,
				[`ml-hero--${c.variant}`]: true,
				[`ml-hero--${c.size}`]: true,
				[`ml-hero--bg-${c.background}`]: c.background !== 'none'
			})}
		>
			<div class="ml-hero__container">
				<div class="ml-hero__content">
					<slot name="eyebrow">
						${when(false, () => html``)}
					</slot>

					<slot name="title">
						${when(!!c.title, () => html`
							<h1 class="ml-hero__title">${c.title}</h1>
						`)}
					</slot>

					<slot name="description">
						${when(!!c.description, () => html`
							<p class="ml-hero__description">${c.description}</p>
						`)}
					</slot>

					<div class="ml-hero__actions">
						<slot name="actions"></slot>
					</div>

					${when(!isSplit, () => html`
						<div class="ml-hero__social-proof">
							<slot name="social-proof"></slot>
						</div>
					`)}
				</div>

				${when(isSplit, () => html`
					<div class="ml-hero__media">
						<slot name="media"></slot>
					</div>
				`)}

				${when(!isSplit, () => html`
					<div class="ml-hero__media ml-hero__media--below">
						<slot name="media"></slot>
					</div>
				`)}
			</div>

			${when(isSplit, () => html`
				<div class="ml-hero__social-proof">
					<slot name="social-proof"></slot>
				</div>
			`)}
		</section>
	`;
}
