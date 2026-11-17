import { html, when } from '@melodicdev/core';
import type { PopoverComponent } from './popover.component.js';

export function popoverTemplate(c: PopoverComponent) {
	return html`
		<div class="ml-popover">
			<div class="ml-popover__trigger" @click=${c.toggle}>
				<slot name="trigger"></slot>
			</div>
			<div
				class="ml-popover__content"
				popover=${c.manual ? 'manual' : 'auto'}
				role="dialog"
				aria-label=${c.label || undefined}
			>
				<slot></slot>
				${when(
					c.arrow,
					() => html`<div class="ml-popover__arrow"></div>`
				)}
			</div>
		</div>
	`;
}
