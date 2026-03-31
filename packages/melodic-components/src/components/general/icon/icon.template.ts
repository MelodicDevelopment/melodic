import { html } from '@melodicdev/core';
import type { IconComponent } from './icon.component.js';

export const iconTemplate = (c: IconComponent) => {
	const className: string = c.format === 'regular' ? 'ph' : `ph-${c.format}`;
	const iconLigature: string = c.format === 'regular' ? c.icon : `${c.icon}-${c.format}`;

	return html`<i class="${className}">${iconLigature}</i>`;
};
