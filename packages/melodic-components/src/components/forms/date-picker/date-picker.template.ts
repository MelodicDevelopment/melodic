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

			<div class="ml-date-picker__trigger">
				<input
					type="date"
					class="ml-date-picker__input"
					.value=${c.value}
					min=${c.min}
					max=${c.max}
					placeholder=${c.placeholder}
					?disabled=${c.disabled}
					?required=${c.required}
					aria-haspopup="dialog"
					aria-expanded=${c.isOpen ? 'true' : 'false'}
					@change=${c.handleInput}
					@click=${c.handleInputClick}
					@keydown=${c.handleKeyDown}
				/>
				<button
					type="button"
					class="ml-date-picker__calendar-btn"
					?disabled=${c.disabled}
					aria-label="Open calendar"
					tabindex="-1"
					@click=${c.toggleCalendar}
				>
					<ml-icon icon="calendar-blank" size="sm" class="ml-date-picker__icon"></ml-icon>
				</button>
			</div>

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
