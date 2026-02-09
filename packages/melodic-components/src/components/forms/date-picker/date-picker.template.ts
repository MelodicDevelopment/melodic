import { html, classMap, when } from '@melodicdev/core';
import type { DatePickerComponent } from './date-picker.component.js';

export function datePickerTemplate(c: DatePickerComponent) {
	return html`
		<div class=${classMap({
			'ml-date-picker': true,
			[`ml-date-picker--${c.size}`]: true,
			'ml-date-picker--error': !!c.error,
			'ml-date-picker--disabled': c.disabled,
			'ml-date-picker--open': c.isOpen
		})}>
			${when(!!c.label, () => html`
				<label class="ml-date-picker__label">
					${c.label}
					${when(c.required, () => html`<span class="ml-date-picker__required">*</span>`)}
				</label>
			`)}

			<button
				type="button"
				class="ml-date-picker__trigger"
				?disabled=${c.disabled}
				aria-haspopup="dialog"
				aria-expanded=${c.isOpen ? 'true' : 'false'}
				@click=${c.toggleCalendar}
				@keydown=${c.handleKeyDown}
			>
				<ml-icon icon="calendar-blank" size="sm" class="ml-date-picker__icon"></ml-icon>
				<span class=${classMap({
					'ml-date-picker__value': true,
					'ml-date-picker__value--placeholder': !c.value
				})}>
					${c.value ? c.displayValue : c.placeholder}
				</span>
			</button>

			<div class="ml-date-picker__popover" popover="auto">
				<ml-calendar
					value=${c.value}
					min=${c.min}
					max=${c.max}
					@ml:select=${c.handleDateSelect}
				></ml-calendar>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-date-picker__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-date-picker__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}
