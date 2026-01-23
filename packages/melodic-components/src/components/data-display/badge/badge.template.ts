import { html, classMap } from '@melodicdev/core';
import type { BadgeComponent } from './badge.component.js';

export function badgeTemplate(c: BadgeComponent) {
	return html`
		<span
			class=${classMap({
				'ml-badge': true,
				[`ml-badge--${c.variant}`]: true,
				[`ml-badge--${c.size}`]: true,
				'ml-badge--dot': c.dot,
				'ml-badge--pill': c.pill
			})}
		>
			${c.dot ? html`<span class="ml-badge__dot"></span>` : ''}
			<slot></slot>
		</span>
	`;
}
