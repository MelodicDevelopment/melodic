import { html, classMap } from '@melodicdev/core';
import type { DividerComponent } from './divider.component.js';

/**
 * The label slot is always rendered so `slotchange` fires when label content
 * is added or removed after mount (see DividerComponent.onCreate). The empty
 * label span is hidden via CSS when there is no content.
 */
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
			<span class="ml-divider__label">
				<slot></slot>
			</span>
		</div>
	`;
}
