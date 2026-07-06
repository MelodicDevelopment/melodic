import { html, classMap } from '@melodicdev/core';
import type { CardComponent } from './card.component.js';

// The header/footer slots are ALWAYS rendered — hiding their wrappers with a
// class instead of `when` keeps slotchange firing, so content inserted after
// mount still projects.
export function cardTemplate(c: CardComponent) {
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
			<div class=${classMap({
				'ml-card__header': true,
				'ml-card__header--hidden': !c.hasHeader
			})}>
				<slot name="header"></slot>
			</div>
			<div class="ml-card__body">
				<slot></slot>
			</div>
			<div class=${classMap({
				'ml-card__footer': true,
				'ml-card__footer--hidden': !c.hasFooter
			})}>
				<slot name="footer"></slot>
			</div>
		</div>
	`;
}
