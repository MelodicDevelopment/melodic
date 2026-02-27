import { html, classMap, when } from '@melodicdev/core';
import type { TextareaComponent } from './textarea.component.js';

export function textareaTemplate(c: TextareaComponent) {
	return html`
		<div
			class=${classMap({
				'ml-textarea': true,
				[`ml-textarea--${c.size}`]: true,
				'ml-textarea--disabled': c.disabled,
				'ml-textarea--readonly': c.readonly,
				'ml-textarea--error': !!c.error,
				'ml-textarea--focused': c.focused,
				'ml-textarea--resize': c.resize
			})}
		>
			${when(
				!!c.label,
				() => html`
					<label class="ml-textarea__label" for="textarea">
						${c.label}
						${when(c.required, () => html`<span class="ml-textarea__required">*</span>`)}
					</label>
				`
			)}

			<textarea
				id="textarea"
				class="ml-textarea__field"
				.value=${c.value}
				placeholder="${c.placeholder}"
				rows="${c.rows}"
				?disabled=${c.disabled}
				?readonly=${c.readonly}
				?required=${c.required}
				maxlength="${c.maxLength || ''}"
				aria-invalid=${c.error ? 'true' : 'false'}
				aria-describedby=${c.error ? 'error' : c.hint ? 'hint' : ''}
				@input=${c.handleInput}
				@change=${c.handleChange}
				@focus=${c.handleFocus}
				@blur=${c.handleBlur}
			></textarea>

			<div class="ml-textarea__footer">
				${when(
					!!c.error,
					() => html`<span id="error" class="ml-textarea__error">${c.error}</span>`,
					() => html`${when(!!c.hint, () => html`<span id="hint" class="ml-textarea__hint">${c.hint}</span>`)}`
				)}
				${when(
					c.maxLength > 0,
					() => html`
						<span class="ml-textarea__counter"> ${c.value.length} / ${c.maxLength} </span>
					`
				)}
			</div>
		</div>
	`;
}
