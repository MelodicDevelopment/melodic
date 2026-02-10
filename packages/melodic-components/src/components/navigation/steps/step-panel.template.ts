import { html } from '@melodicdev/core';
import type { StepPanelComponent } from './step-panel.component.js';

export function stepPanelTemplate(_c: StepPanelComponent) {
	return html`
		<div class="ml-step-panel" role="tabpanel">
			<slot></slot>
		</div>
	`;
}
