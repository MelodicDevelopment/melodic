import { html, when } from '@melodicdev/core';
import type { SidebarGroupComponent } from './sidebar-group.component.js';

export function sidebarGroupTemplate(c: SidebarGroupComponent) {
	return html`
		<div class="ml-sidebar-group">
			${when(!!c.label && !c.collapsed, () => html`
				<span class="ml-sidebar-group__label">${c.label}</span>
			`)}
			<div class="ml-sidebar-group__items">
				<slot></slot>
			</div>
		</div>
	`;
}
