import { html, classMap, when } from '@melodicdev/core';
import type { Radio } from './radio.component.js';

export function radioTemplate(c: Radio) {
	return html`
		<label
			class=${classMap({
				'ml-radio': true,
				[`ml-radio--${c.size}`]: true,
				'ml-radio--checked': c.checked,
				'ml-radio--disabled': c.disabled
			})}
		>
			<input
				type="radio"
				class="ml-radio__input"
				name="${c.name}"
				value="${c.value}"
				.checked=${c.checked}
				?disabled=${c.disabled}
				@change=${c.handleChange}
			/>
			<span class="ml-radio__circle">
				<span class="ml-radio__dot"></span>
			</span>
			${when(!!c.label, () => html`<span class="ml-radio__label">${c.label}</span>`)}
		</label>
		${when(!!c.hint, () => html`<span class="ml-radio__hint">${c.hint}</span>`)}
	`;
}
