import { html, classMap, when } from '@melodicdev/core';
import type { StatCardComponent } from './stat-card.component.js';

export function statCardTemplate(c: StatCardComponent) {
	const iconStyle = c['icon-color'] ? `--ml-stat-card-icon-color: ${c['icon-color']}` : '';

	return html`
		<div class="ml-stat-card">
			<div class="ml-stat-card__header">
				<span class="ml-stat-card__label">${c.label}</span>
				${when(!!c.icon, () => html`
					<div class="ml-stat-card__icon" style=${iconStyle}>
						<ml-icon icon=${c.icon} size="sm"></ml-icon>
					</div>
				`)}
			</div>
			<div class=${classMap({
				'ml-stat-card__value': true,
				'ml-stat-card__value--serif': c['value-font'] === 'serif',
				'ml-stat-card__value--sans': c['value-font'] === 'sans'
			})}>${c.value}</div>
			${when(!!c.trend, () => html`
				<div class=${classMap({
					'ml-stat-card__trend': true,
					[`ml-stat-card__trend--${c['trend-direction']}`]: true
				})}>${c.trend}</div>
			`)}
		</div>
	`;
}
