import { html, classMap, when } from '@melodicdev/core';
import type { Toggle } from './toggle.component.js';

export function toggleTemplate(c: Toggle) {
	return html`
		<label
			class=${classMap({
				'ml-toggle': true,
				[`ml-toggle--${c.size}`]: true,
				'ml-toggle--checked': c.checked,
				'ml-toggle--disabled': c.disabled
			})}
		>
			<input type="checkbox" class="ml-toggle__input" .checked=${c.checked} ?disabled=${c.disabled} @change=${c.handleChange} />
			<span class="ml-toggle__track">
				<span class="ml-toggle__thumb"></span>
			</span>
			${when(!!c.label, () => html`<span class="ml-toggle__label">${c.label}</span>`)}
		</label>
		${when(!!c.hint, () => html`<span class="ml-toggle__hint">${c.hint}</span>`)}
	`;
}
