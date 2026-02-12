import { html, classMap, when } from '@melodicdev/core';
import type { RadioCardGroupComponent } from './radio-card-group.component.js';

export function radioCardGroupTemplate(c: RadioCardGroupComponent) {
	return html`
		<fieldset
			class=${classMap({
				'ml-radio-card-group': true,
				'ml-radio-card-group--disabled': c.disabled,
				'ml-radio-card-group--error': !!c.error
			})}
			role="radiogroup"
			aria-labelledby=${c.label ? 'legend' : ''}
		>
			${when(
				!!c.label,
				() => html`
					<legend id="legend" class="ml-radio-card-group__legend">
						${c.label}
						${when(c.required, () => html`<span class="ml-radio-card-group__required">*</span>`)}
					</legend>
				`
			)}

			<div class=${classMap({
				'ml-radio-card-group__options': true,
				[`ml-radio-card-group__options--${c.orientation}`]: true
			})}>
				<slot @slotchange=${c.handleSlotChange}></slot>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-radio-card-group__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-radio-card-group__hint">${c.hint}</span>`)}`
			)}
		</fieldset>
	`;
}
