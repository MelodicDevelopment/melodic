import { html, classMap, when } from '@melodicdev/core';
import type { BadgeGroupComponent } from './badge-group.component.js';

export function badgeGroupTemplate(c: BadgeGroupComponent) {
	const isTrailing = c.badgePosition === 'trailing';

	return html`
		<span
			class=${classMap({
				'ml-badge-group': true,
				'ml-badge-group--pill': c.theme === 'pill',
				'ml-badge-group--modern': c.theme === 'modern',
				'ml-badge-group--sm': c.size === 'sm',
				'ml-badge-group--md': c.size === 'md',
				'ml-badge-group--lg': c.size === 'lg',
				[`ml-badge-group--${c.variant}`]: true
			})}
		>
			${when(!isTrailing && !!c.label, () => html`<span class="ml-badge-group__label ml-badge-group__label--${c.variant}">${c.label}</span>`)}
			<span class="ml-badge-group__text">
				<slot></slot>
			</span>
			${when(isTrailing && !!c.label, () => html`<span class="ml-badge-group__label ml-badge-group__label--${c.variant}">${c.label}</span>`)}
			${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm" class="ml-badge-group__icon"></ml-icon>`)}
		</span>
	`;
}
