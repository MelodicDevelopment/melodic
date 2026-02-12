import { html, classMap } from '@melodicdev/core';
import type { ToastContainerComponent } from './toast-container.component.js';

export function toastContainerTemplate(c: ToastContainerComponent) {
	return html`
		<div
			class=${classMap({
				'ml-toast-container': true,
				[`ml-toast-container--${c.position}`]: true
			})}
		>
			<slot></slot>
		</div>
	`;
}
