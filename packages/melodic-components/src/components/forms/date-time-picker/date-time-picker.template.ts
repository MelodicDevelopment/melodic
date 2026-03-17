import { html, classMap, when } from '@melodicdev/core';
import type { DateTimePickerComponent } from './date-time-picker.component.js';

export function dateTimePickerTemplate(c: DateTimePickerComponent) {
	return html`
		<div class=${classMap({
			'ml-date-time-picker': true,
			[`ml-date-time-picker--${c.size}`]: true,
			'ml-date-time-picker--error': !!c.error,
			'ml-date-time-picker--disabled': c.disabled
		})}>
			${when(!!c.label, () => html`
				<label class="ml-date-time-picker__label">
					${c.label}
					${when(c.required, () => html`<span class="ml-date-time-picker__required">*</span>`)}
				</label>
			`)}

			<div class="ml-date-time-picker__row">
				<ml-date-picker
					.value=${c.dateValue}
					size=${c.size}
					?disabled=${c.disabled}
					?required=${c.required}
					min=${c.minDate}
					max=${c.maxDate}
					placeholder="Select date"
				></ml-date-picker>

				<span class="ml-date-time-picker__divider"></span>

				<ml-time-picker
					.value=${c.timeValue}
					size=${c.size}
					?disabled=${c.disabled}
					min=${c.minTime}
					max=${c.maxTime}
					step=${c.step}
					.twelveHour=${c.use12Hour}
					placeholder="Select time"
				></ml-time-picker>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-date-time-picker__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-date-time-picker__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}
