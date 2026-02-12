import { html, classMap, when } from '@melodicdev/core';
import type { TabComponent } from './tab.component.js';

export function tabTemplate(c: TabComponent) {
	return html`
		<button
			type="button"
			role="tab"
			class=${classMap({
				'ml-tab': true,
				'ml-tab--active': c.active,
				'ml-tab--disabled': c.disabled
			})}
			aria-selected=${c.active}
			aria-disabled=${c.disabled}
			tabindex=${c.active ? '0' : '-1'}
			?disabled=${c.disabled}
			@click=${c.handleClick}
		>
			${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
			<span class="ml-tab__label">${c.label}</span>
			<slot></slot>
		</button>
	`;
}
