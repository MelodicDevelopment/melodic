import { html, when } from '@melodicdev/core';
import type { DropdownGroupComponent } from './dropdown-group.component.js';

export function dropdownGroupTemplate(c: DropdownGroupComponent) {
	return html`
		<div class="ml-dropdown-group" role="group">
			${when(
				!!c.label,
				() => html`<div class="ml-dropdown-group__label">${c.label}</div>`
			)}
			<slot></slot>
		</div>
	`;
}
