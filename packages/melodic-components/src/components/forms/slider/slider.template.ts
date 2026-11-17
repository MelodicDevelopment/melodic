import { html, classMap, styleMap, when } from '@melodicdev/core';
import type { SliderComponent } from './slider.component.js';

// Binding order matters: `min` / `max` / `step` come BEFORE `.value`. A range
// input clamps a value to the range in force when it is assigned, so writing
// the value first clamped it to the default 0–100 and `max="1000" value="500"`
// rendered its thumb at 100.
export function sliderTemplate(c: SliderComponent) {
	return html`
		<div
			class=${classMap({
				'ml-slider': true,
				[`ml-slider--${c.size}`]: true,
				'ml-slider--disabled': c.disabled,
				'ml-slider--error': !!c.error
			})}
		>
			${when(
				!!c.label || c.showValue,
				() => html`
					<div class="ml-slider__header">
						${when(!!c.label, () => html`<label class="ml-slider__label">${c.label}</label>`)}
						${when(c.showValue, () => html`<span class="ml-slider__value">${c.value}</span>`)}
					</div>
				`
			)}

			<div class="ml-slider__track-wrapper">
				<div class="ml-slider__track">
					<div class="ml-slider__fill" style=${styleMap({ width: c.fillWidth })}></div>
				</div>
				<input
					class="ml-slider__input"
					type="range"
					min=${c.min}
					max=${c.max}
					step=${c.step}
					.value=${String(c.value)}
					disabled=${c.disabled}
					aria-label=${c.label || 'Slider'}
					@input=${c.handleInput}
					@change=${c.handleChange}
				/>
			</div>

			${when(
				!!c.error,
				() => html`<span class="ml-slider__error">${c.error}</span>`,
				() => html`${when(!!c.hint, () => html`<span class="ml-slider__hint">${c.hint}</span>`)}`
			)}
		</div>
	`;
}
