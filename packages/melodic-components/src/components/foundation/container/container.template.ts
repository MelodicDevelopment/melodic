import { html, styleMap } from '@melodicdev/core';
import type { ContainerComponent } from './container.component.js';

export function containerTemplate(c: ContainerComponent) {
	return html`
		<div class="ml-container" style=${styleMap(c.getStyles())}>
			<slot></slot>
		</div>
	`;
}
