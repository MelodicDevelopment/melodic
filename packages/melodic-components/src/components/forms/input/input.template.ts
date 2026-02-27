import { html, classMap, when } from '@melodicdev/core';
import type { InputComponent } from './input.component.js';

export function inputTemplate(c: InputComponent) {
	return html`
		<div
			class=${classMap({
				'ml-input': true,
				[`ml-input--${c.size}`]: true,
				'ml-input--disabled': c.disabled,
				'ml-input--readonly': c.readonly,
				'ml-input--error': !!c.error,
				'ml-input--focused': c.focused
			})}
		>
			${when(
				!!c.label,
				() => html`
					<label class="ml-input__label" for="input">
						${c.label}
						${when(c.required, () => html`<span class="ml-input__required">*</span>`)}
					</label>
				`
			)}

			<div class="ml-input__wrapper">
				<slot name="prefix"></slot>
				<input
					id="input"
					class="ml-input__field"
					type="${c.type}"
					.value=${c.value}
					placeholder="${c.placeholder}"
					?disabled=${c.disabled}
					?readonly=${c.readonly}
					?required=${c.required}
					autocomplete="${c.autocomplete}"
					aria-invalid=${c.error ? 'true' : 'false'}
					aria-describedby=${c.error ? 'error' : c.hint ? 'hint' : ''}
					@input=${c.handleInput}
					@change=${c.handleChange}
					@focus=${c.handleFocus}
					@blur=${c.handleBlur}
				/>
				<slot name="suffix"></slot>
			</div>

			${when(
				!!c.error,
				() => html`<span id="error" class="ml-input__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span id="hint" class="ml-input__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}
