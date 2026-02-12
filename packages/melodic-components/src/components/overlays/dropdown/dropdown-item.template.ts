import { html, classMap, when } from '@melodicdev/core';
import type { DropdownItemComponent } from './dropdown-item.component.js';

export function dropdownItemTemplate(c: DropdownItemComponent) {
	return html`
		<div
			class=${classMap({
				'ml-dropdown-item': true,
				'ml-dropdown-item--focused': c.focused,
				'ml-dropdown-item--disabled': c.disabled,
				'ml-dropdown-item--destructive': c.destructive
			})}
			role="menuitem"
			tabindex="-1"
			aria-disabled=${c.disabled || false}
			@click=${c.handleClick}
		>
			${when(
				!!c.icon,
				() => html`<ml-icon class="ml-dropdown-item__icon" icon=${c.icon} size="sm"></ml-icon>`
			)}
			<span class="ml-dropdown-item__label"><slot></slot></span>
			${when(
				!!c.addon,
				() => html`<span class="ml-dropdown-item__addon">${c.addon}</span>`
			)}
		</div>
	`;
}
