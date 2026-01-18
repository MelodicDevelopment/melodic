import { html, classMap } from '@melodicdev/core';
import type { Badge } from './badge.component.js';

export function badgeTemplate(c: Badge) {
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
