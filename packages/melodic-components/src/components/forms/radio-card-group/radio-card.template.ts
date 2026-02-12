import { html, classMap, when } from '@melodicdev/core';
import type { RadioCardComponent } from './radio-card.component.js';

export function radioCardTemplate(c: RadioCardComponent) {
	return html`
		<div
			class=${classMap({
				'ml-radio-card': true,
				'ml-radio-card--selected': c.selected,
				'ml-radio-card--disabled': c.isDisabled
			})}
			role="radio"
			aria-checked=${c.selected ? 'true' : 'false'}
			aria-disabled=${c.isDisabled ? 'true' : 'false'}
			tabindex=${c.isDisabled ? '-1' : '0'}
			@click=${c.handleClick}
			@keydown=${(e: KeyboardEvent) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); c.handleClick(); } }}
		>
			<div class="ml-radio-card__radio">
				<span class="ml-radio-card__circle">
					<span class="ml-radio-card__dot"></span>
				</span>
			</div>

			<div class="ml-radio-card__content">
				${when(!!c.icon, () => html`
					<ml-icon icon=${c.icon} size="md" class="ml-radio-card__icon"></ml-icon>
				`)}
				<div class="ml-radio-card__text">
					${when(!!c.label, () => html`<span class="ml-radio-card__label">${c.label}</span>`)}
					${when(!!c.description, () => html`<span class="ml-radio-card__description">${c.description}</span>`)}
					<slot></slot>
				</div>
			</div>

			${when(!!c.detail, () => html`
				<span class="ml-radio-card__detail">${c.detail}</span>
			`)}
		</div>
	`;
}
