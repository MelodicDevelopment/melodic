import { html, classMap } from '@melodicdev/core';
import type { TooltipComponent } from './tooltip.component.js';

export function tooltipTemplate(c: TooltipComponent) {
	return html`
		<div class="ml-tooltip">
			<div
				class="ml-tooltip__trigger"
				@mouseenter=${c.show}
				@mouseleave=${c.hide}
				@focus=${c.show}
				@blur=${c.hide}
			>
				<slot></slot>
			</div>
			<div
				class=${classMap({
					'ml-tooltip__content': true,
					'ml-tooltip__content--visible': c.isVisible
				})}
				role="tooltip"
				aria-hidden=${!c.isVisible}
			>
				${c.content}
				<div class="ml-tooltip__arrow"></div>
			</div>
		</div>
	`;
}
