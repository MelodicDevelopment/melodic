import { html, classMap } from '@melodicdev/core';
import type { ButtonGroupComponent } from './button-group.component.js';

export function buttonGroupTemplate(c: ButtonGroupComponent) {
	return html`
		<div
			class=${classMap({
				'ml-button-group': true,
				'ml-button-group--disabled': c.disabled
			})}
			role="group"
		>
			<slot @slotchange=${c.handleSlotChange}></slot>
		</div>
	`;
}
