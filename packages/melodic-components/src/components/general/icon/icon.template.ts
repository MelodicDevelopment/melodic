import { html } from '@melodicdev/core';
import type { IconComponent } from './icon.component.js';
import { PHOSPHOR_ICON_MAP } from './icon.map.js';

export const iconTemplate = (c: IconComponent) => {
	const className: string = c.format === 'regular' ? 'ph' : `ph-${c.format}`;
	const codepoint: string = PHOSPHOR_ICON_MAP[c.icon] ?? '';

	return html`<i class="${className}">${codepoint}</i>`;
};
