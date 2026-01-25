import { html, classMap, when } from '@melodicdev/core';
import type { DividerComponent } from './divider.component.js';

export function dividerTemplate(c: DividerComponent) {
	return html`
		<div
			class=${classMap({
				'ml-divider': true,
				[`ml-divider--${c.orientation}`]: true,
				'ml-divider--with-label': c.hasLabel
			})}
			role="separator"
			aria-orientation=${c.orientation}
		>
			${when(
				c.hasLabel,
				() => html`
					<span class="ml-divider__label">
						<slot></slot>
					</span>
				`
			)}
		</div>
	`;
}
