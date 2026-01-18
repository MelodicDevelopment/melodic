import { html, classMap, when } from '@melodicdev/core';
import type { Checkbox } from './checkbox.component.js';

export function checkboxTemplate(c: Checkbox) {
	return html`
		<label
			class=${classMap({
				'ml-checkbox': true,
				[`ml-checkbox--${c.size}`]: true,
				'ml-checkbox--checked': c.checked,
				'ml-checkbox--indeterminate': c.indeterminate,
				'ml-checkbox--disabled': c.disabled
			})}
		>
			<input
				type="checkbox"
				class="ml-checkbox__input"
				.checked=${c.checked}
				.indeterminate=${c.indeterminate}
				?disabled=${c.disabled}
				@change=${c.handleChange}
			/>
			<span class="ml-checkbox__box">
				${when(
					c.checked && !c.indeterminate,
					() => html`
						<svg class="ml-checkbox__check" viewBox="0 0 12 12" fill="none">
							<path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					`
				)}
				${when(
					c.indeterminate,
					() => html`
						<svg class="ml-checkbox__minus" viewBox="0 0 12 12" fill="none">
							<path d="M2.5 6H9.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
						</svg>
					`
				)}
			</span>
			${when(!!c.label, () => html`<span class="ml-checkbox__label">${c.label}</span>`)}
		</label>
		${when(!!c.hint, () => html`<span class="ml-checkbox__hint">${c.hint}</span>`)}
	`;
}
