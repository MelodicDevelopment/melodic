import { html, classMap, when } from '@melodicdev/core';
import type { FormFieldComponent } from './form-field.component.js';

export function formFieldTemplate(c: FormFieldComponent) {
	return html`
		<div
			class=${classMap({
				'ml-form-field': true,
				[`ml-form-field--${c.size}`]: true,
				[`ml-form-field--${c.orientation}`]: true,
				'ml-form-field--disabled': c.disabled,
				'ml-form-field--error': !!c.error
			})}
		>
			${when(
				!!c.label,
				() => html`
					<label class="ml-form-field__label" for=${c.fieldId}>
						${c.label}
						${when(c.required, () => html`<span class="ml-form-field__required">*</span>`)}
					</label>
				`
			)}

			<div class="ml-form-field__control">
				<slot @slotchange=${c.handleSlotChange}></slot>
			</div>

			${when(
				!!c.error,
				() => html`<span id=${c.errorId} class="ml-form-field__error">${c.error}</span>`
			)}
			${when(
				!c.error && !!c.hint,
				() => html`<span id=${c.hintId} class="ml-form-field__hint">${c.hint}</span>`
			)}
		</div>
	`;
}
