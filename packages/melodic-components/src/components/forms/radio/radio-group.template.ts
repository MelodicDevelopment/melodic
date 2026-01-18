import { html, classMap, when } from '@melodicdev/core';
import type { RadioGroup } from './radio-group.component.js';

export function radioGroupTemplate(c: RadioGroup) {
	return html`
		<fieldset
			class=${classMap({
				'ml-radio-group': true,
				[`ml-radio-group--${c.orientation}`]: true,
				'ml-radio-group--disabled': c.disabled,
				'ml-radio-group--error': !!c.error
			})}
			role="radiogroup"
			aria-labelledby=${c.label ? 'legend' : ''}
		>
			${when(
				!!c.label,
				() => html`
					<legend id="legend" class="ml-radio-group__legend">
						${c.label}
						${when(c.required, () => html`<span class="ml-radio-group__required">*</span>`)}
					</legend>
				`
			)}

			<div class="ml-radio-group__options">
				<slot></slot>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-radio-group__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-radio-group__hint">${c.hint}</span>`)}`
			)}
		</fieldset>
	`;
}
