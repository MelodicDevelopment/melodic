import { html } from '@melodicdev/core';
import type { IconComponent } from './icon.component.js';

export function iconTemplate(c: IconComponent) {
	return html`<i class="ph ph-${c.name}"></i>`;
}
