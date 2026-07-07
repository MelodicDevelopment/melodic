import { html, classMap, when } from '@melodicdev/core';
import type { ButtonGroupComponent } from './button-group.component.js';

export function buttonGroupTemplate(c: ButtonGroupComponent) {
	return html`
		<div
			class=${classMap({
				'ml-button-group': true,
				'ml-button-group--disabled': c.disabled,
				'ml-button-group--error': !!c.error
			})}
			role="group"
		>
			<slot @slotchange=${c.handleSlotChange}></slot>
		</div>
		${when(!!c.error, () => html`<span class="ml-button-group__error">${c.error}</span>`)}
	`;
}
