import { html } from '@melodicdev/core';
import type { TabPanelComponent } from './tab-panel.component.js';

export function tabPanelTemplate(c: TabPanelComponent) {
	return html`
		<div class="ml-tab-panel" role="tabpanel" aria-label=${c.panelLabel || c.value}>
			<slot></slot>
		</div>
	`;
}
