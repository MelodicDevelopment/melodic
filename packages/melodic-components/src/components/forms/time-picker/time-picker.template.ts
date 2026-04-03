import { html, classMap, when } from '@melodicdev/core';
import type { TimePickerComponent } from './time-picker.component.js';

export function timePickerTemplate(c: TimePickerComponent) {
	return html`
		<div class=${classMap({
			'ml-time-picker': true,
			[`ml-time-picker--${c.size}`]: true,
			'ml-time-picker--error': !!c.error,
			'ml-time-picker--disabled': c.disabled,
			'ml-time-picker--open': c.isOpen
		})}>
			${when(!!c.label, () => html`
				<label class="ml-time-picker__label">
					${c.label}
					${when(c.required, () => html`<span class="ml-time-picker__required">*</span>`)}
				</label>
			`)}

			<div class="ml-time-picker__trigger">
				<input
					type="time"
					class="ml-time-picker__input"
					.value=${c.value}
					min=${c.min}
					max=${c.max}
					step=${c.showSeconds ? '1' : '60'}
					placeholder=${c.placeholder}
					?disabled=${c.disabled}
					?required=${c.required}
					aria-haspopup="dialog"
					aria-expanded=${c.isOpen ? 'true' : 'false'}
					@change=${c.handleTimeInput}
					@click=${c.handleInputClick}
					@keydown=${c.handleKeyDown}
				/>
				<button
					type="button"
					class="ml-time-picker__clock-btn"
					?disabled=${c.disabled}
					aria-label="Open time picker"
					tabindex="-1"
					@click=${c.togglePopover}
				>
					<ml-icon icon="clock" size="sm" class="ml-time-picker__icon"></ml-icon>
				</button>
			</div>

			<div class="ml-time-picker__popover" popover="auto">
				<div class="ml-time-picker__spinner-group">
					<!-- Hour spinner -->
					<div class="ml-time-picker__spinner">
						<button type="button" class="ml-time-picker__spin-btn" aria-label="Increment hour" @click=${c.incrementHour}>
							<ml-icon icon="caret-up" size="sm"></ml-icon>
						</button>
						<input
							type="text"
							inputmode="numeric"
							class="ml-time-picker__spin-input"
							.value=${c.displayHour}
							aria-label="Hour"
							@input=${c.handleHourInput}
							@focus=${c.handleInputFocus}
							@blur=${c.handleHourBlur}
							@keydown=${c.handleSpinnerKeyDown}
						/>
						<button type="button" class="ml-time-picker__spin-btn" aria-label="Decrement hour" @click=${c.decrementHour}>
							<ml-icon icon="caret-down" size="sm"></ml-icon>
						</button>
					</div>

					<span class="ml-time-picker__separator">:</span>

					<!-- Minute spinner -->
					<div class="ml-time-picker__spinner">
						<button type="button" class="ml-time-picker__spin-btn" aria-label="Increment minute" @click=${c.incrementMinute}>
							<ml-icon icon="caret-up" size="sm"></ml-icon>
						</button>
						<input
							type="text"
							inputmode="numeric"
							class="ml-time-picker__spin-input"
							.value=${c.displayMinute}
							aria-label="Minute"
							@input=${c.handleMinuteInput}
							@focus=${c.handleInputFocus}
							@blur=${c.handleMinuteBlur}
							@keydown=${c.handleSpinnerKeyDown}
						/>
						<button type="button" class="ml-time-picker__spin-btn" aria-label="Decrement minute" @click=${c.decrementMinute}>
							<ml-icon icon="caret-down" size="sm"></ml-icon>
						</button>
					</div>

					${when(c.showSeconds, () => html`
						<span class="ml-time-picker__separator">:</span>
						<div class="ml-time-picker__spinner">
							<button type="button" class="ml-time-picker__spin-btn" aria-label="Increment second" @click=${c.incrementSecond}>
								<ml-icon icon="caret-up" size="sm"></ml-icon>
							</button>
							<input
								type="text"
								inputmode="numeric"
								class="ml-time-picker__spin-input"
								.value=${c.displaySecond}
								aria-label="Second"
								@input=${c.handleSecondInput}
								@focus=${c.handleInputFocus}
								@blur=${c.handleSecondBlur}
								@keydown=${c.handleSpinnerKeyDown}
							/>
							<button type="button" class="ml-time-picker__spin-btn" aria-label="Decrement second" @click=${c.decrementSecond}>
								<ml-icon icon="caret-down" size="sm"></ml-icon>
							</button>
						</div>
					`)}

					${when(c.use12Hour, () => html`
						<div class="ml-time-picker__period">
							<button type="button" class="ml-time-picker__period-btn" @click=${c.togglePeriod}>
								${c.editPeriod}
							</button>
						</div>
					`)}
				</div>

				<div class="ml-time-picker__footer">
					<button type="button" class="ml-time-picker__now-btn" @click=${c.handleNowClick}>Now</button>
					<button type="button" class="ml-time-picker__confirm-btn" @click=${c.confirmSelection}>OK</button>
				</div>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-time-picker__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-time-picker__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}
