import { html } from '@melodicdev/core';
import type { IconComponent } from './icon.component.js';

export const iconTemplate = (c: IconComponent) => {
	const baseClass: string = c.format === 'regular' ? 'ph' : `ph-${c.format}`;

	return html`<i class="${baseClass} ph-${c.icon}"></i>`;
};
