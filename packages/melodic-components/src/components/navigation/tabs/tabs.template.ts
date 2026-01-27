import { html, classMap, repeat, when } from '@melodicdev/core';
import type { TabsComponent } from './tabs.component.js';
import type { TabConfig } from './tabs.types.js';

export function tabsTemplate(c: TabsComponent) {
	const hasTabs = c.tabs.length > 0;

	return html`
		<div
			class=${classMap({
				'ml-tabs': true,
				[`ml-tabs--${c.variant}`]: true,
				[`ml-tabs--${c.size}`]: true,
				[`ml-tabs--${c.orientation}`]: true
			})}
		>
			<div
				class="ml-tabs__list"
				role="tablist"
				aria-orientation=${c.orientation}
				@keydown=${c.handleKeyDown}
			>
				${hasTabs
					? repeat(
							c.tabs,
							(tab) => `${tab.value}-${c.value === tab.value}`,
							(tab) => renderTabButton(c, tab)
						)
					: html`<slot name="tab" @slotchange=${c.handleTabSlotChange}></slot>`}
			</div>

			<div class="ml-tabs__panels">
				<slot></slot>
			</div>
		</div>
	`;
}

function renderTabButton(c: TabsComponent, tab: TabConfig) {
	const isActive = c.value === tab.value;

	return html`
		<button
			type="button"
			role="tab"
			class=${classMap({
				'ml-tabs__tab': true,
				'ml-tabs__tab--active': isActive,
				'ml-tabs__tab--disabled': !!tab.disabled
			})}
			data-value=${tab.value}
			aria-selected=${isActive}
			aria-disabled=${tab.disabled || false}
			tabindex=${isActive ? '0' : '-1'}
			?disabled=${tab.disabled}
			@click=${() => c.handleTabClick(tab.value, tab.href)}
		>
			${when(!!tab.icon, () => html`<ml-icon icon=${tab.icon} size="sm"></ml-icon>`)}
			<span class="ml-tabs__tab-label">${tab.label}</span>
		</button>
	`;
}
