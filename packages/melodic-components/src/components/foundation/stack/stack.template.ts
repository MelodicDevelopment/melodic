import { html, styleMap } from '@melodicdev/core';
import type { StackComponent } from './stack.component.js';

export function stackTemplate(c: StackComponent) {
	return html`
		<div class="ml-stack" style=${styleMap(c.getStyles())}>
			<slot></slot>
		</div>
	`;
}
