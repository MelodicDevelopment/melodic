import { html, when } from '@melodicdev/core';
import type { ButtonGroupItemComponent } from './button-group-item.component.js';

export function buttonGroupItemTemplate(c: ButtonGroupItemComponent) {
	return html`
		<button
			type="button"
			class="ml-button-group-item"
			?disabled=${c.isDisabled}
			aria-pressed=${c.active ? 'true' : 'false'}
			@click=${c.handleClick}
		>
			${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
			<slot></slot>
		</button>
	`;
}
