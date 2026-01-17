import { html, styleMap } from '@melodicdev/core';
import type { Stack } from './stack.component.js';

export function stackTemplate(c: Stack) {
	return html`
		<div class="ml-stack" style=${styleMap(c.getStyles())}>
			<slot></slot>
		</div>
	`;
}
