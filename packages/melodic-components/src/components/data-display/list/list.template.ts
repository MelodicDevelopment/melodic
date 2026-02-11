import { html, classMap } from '@melodicdev/core';
import type { ListComponent } from './list.component.js';

export function listTemplate(c: ListComponent) {
	return html`
		<div
			class=${classMap({
				'ml-list': true,
				[`ml-list--${c.variant}`]: true,
				[`ml-list--${c.size}`]: true
			})}
			role="list"
		>
			<slot></slot>
		</div>
	`;
}
