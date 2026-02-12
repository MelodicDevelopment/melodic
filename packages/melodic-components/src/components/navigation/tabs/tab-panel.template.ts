import { html } from '@melodicdev/core';
import type { TabPanelComponent } from './tab-panel.component.js';

export function tabPanelTemplate(_c: TabPanelComponent) {
	return html`
		<div class="ml-tab-panel" role="tabpanel">
			<slot></slot>
		</div>
	`;
}
