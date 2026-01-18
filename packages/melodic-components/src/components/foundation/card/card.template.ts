import { html, classMap, when } from '@melodicdev/core';
import type { Card } from './card.component.js';

export function cardTemplate(c: Card) {
	return html`
		<div
			class=${classMap({
				'ml-card': true,
				[`ml-card--${c.variant}`]: true,
				'ml-card--hoverable': c.hoverable,
				'ml-card--clickable': c.clickable
			})}
			@click=${c.handleClick}
		>
			${when(
				c.hasHeader,
				() => html`
					<div class="ml-card__header">
						<slot name="header"></slot>
					</div>
				`
			)}
			<div class="ml-card__body">
				<slot></slot>
			</div>
			${when(
				c.hasFooter,
				() => html`
					<div class="ml-card__footer">
						<slot name="footer"></slot>
					</div>
				`
			)}
		</div>
	`;
}
