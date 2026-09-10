import { html, devWarn } from '@melodicdev/core';
import type { IconComponent } from './icon.component.js';
import { PHOSPHOR_ICON_MAP } from './icon.map.js';

export const iconTemplate = (c: IconComponent) => {
	const className: string = c.format === 'regular' ? 'ph' : `ph-${c.format}`;
	const codepoint: string = PHOSPHOR_ICON_MAP[c.icon] ?? '';

	// An unknown name rendered an empty <i> with no diagnostic, so a typo was
	// invisible: the icon simply did not appear.
	if (c.icon && !codepoint) {
		devWarn(
			`unknown-icon:${c.icon}`,
			`<ml-icon icon="${c.icon}"> is not a known Phosphor icon name, so nothing is rendered. ` +
				'Check the name against https://phosphoricons.com (kebab-case, e.g. "caret-double-left").'
		);
	}

	// aria-hidden: the ligature codepoint is presentational; without it screen
	// readers announce the raw private-use character.
	return html`<i class="${className}" aria-hidden="true">${codepoint}</i>`;
};
