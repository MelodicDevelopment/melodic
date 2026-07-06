import { html } from '@melodicdev/core';
import type { StepPanelComponent } from './step-panel.component.js';

export function stepPanelTemplate(c: StepPanelComponent) {
	return html`
		<div class="ml-step-panel" role="tabpanel" aria-label=${c.panelLabel || c.value}>
			<slot></slot>
		</div>
	`;
}
