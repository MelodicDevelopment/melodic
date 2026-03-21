import { html, classMap, when } from '@melodicdev/core';
import type { ProfileCardComponent } from './profile-card.component.js';

export function profileCardTemplate(c: ProfileCardComponent) {
	return html`
		<div class="ml-profile-card">
			<div class="ml-profile-card__banner"></div>
			<div class="ml-profile-card__identity">
				<div class="ml-profile-card__avatar">
					<ml-avatar
						size=${c['avatar-size']}
						src=${c.avatar}
						initials=${c.initials}
					></ml-avatar>
				</div>
				<h2 class="ml-profile-card__name">${c.name}</h2>
				${when(!!c.subtitle, () => html`
					<p class="ml-profile-card__subtitle">${c.subtitle}</p>
				`)}
			</div>
			<div class=${classMap({
				'ml-profile-card__section': true,
				'ml-profile-card__actions': true,
				'ml-profile-card__section--hidden': !c.hasActions
			})}>
				<slot name="actions"></slot>
			</div>
			<div class=${classMap({
				'ml-profile-card__section': true,
				'ml-profile-card__details': true,
				'ml-profile-card__section--hidden': !c.hasDetails
			})}>
				<div class="ml-profile-card__section-label">Contact</div>
				<slot name="details"></slot>
			</div>
			<div class=${classMap({
				'ml-profile-card__section': true,
				'ml-profile-card__tags': true,
				'ml-profile-card__section--hidden': !c.hasTags
			})}>
				<div class="ml-profile-card__section-label">Involvement</div>
				<slot name="tags"></slot>
			</div>
			<div class=${classMap({
				'ml-profile-card__section': true,
				'ml-profile-card__meta': true,
				'ml-profile-card__section--hidden': !c.hasMeta
			})}>
				<div class="ml-profile-card__section-label">Details</div>
				<slot name="meta"></slot>
			</div>
		</div>
	`;
}
