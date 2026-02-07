import { html, when } from '@melodicdev/core';
import type { DropdownComponent } from './dropdown.component.js';

export function dropdownTemplate(c: DropdownComponent) {
	return html`
		<div class="ml-dropdown">
			<div class="ml-dropdown__trigger" @click=${c.toggle}>
				<slot name="trigger"></slot>
			</div>
			<div
				class="ml-dropdown__menu"
				role="menu"
				popover="auto"
			>
				<slot></slot>
				${when(
					c.arrow,
					() => html`<div class="ml-dropdown__arrow"></div>`
				)}
			</div>
		</div>
	`;
}
