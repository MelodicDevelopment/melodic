import { html, classMap } from '@melodicdev/core';
import type { BadgeComponent } from './badge.component.js';

export function badgeTemplate(c: BadgeComponent) {
	const customStyle = c.color ? `--ml-badge-bg: ${c.color}; --ml-badge-color: #fff` : '';

	return html`
		<span
			class=${classMap({
				'ml-badge': true,
				[`ml-badge--${c.variant}`]: !c.color,
				'ml-badge--custom': !!c.color,
				[`ml-badge--${c.size}`]: true,
				'ml-badge--dot': c.dot,
				'ml-badge--pill': c.pill
			})}
			style=${customStyle}
		>
			${c.dot ? html`<span class="ml-badge__dot"></span>` : ''}
			<slot></slot>
		</span>
	`;
}
