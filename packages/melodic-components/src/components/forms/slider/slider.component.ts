import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { sliderTemplate } from './slider.template.js';
import { sliderStyles } from './slider.styles.js';

/**
 * ml-slider - Range slider input
 *
 * @example
 * ```html
 * <ml-slider label="Volume" value="50"></ml-slider>
 * <ml-slider label="Price" min="0" max="1000" step="10" show-value></ml-slider>
 * ```
 *
 * @fires ml:input - Emitted on each input change
 * @fires ml:change - Emitted on final change (mouseup/touchend)
 */
@MelodicComponent({
	selector: 'ml-slider',
	template: sliderTemplate,
	styles: sliderStyles,
	attributes: ['label', 'value', 'min', 'max', 'step', 'size', 'disabled', 'show-value', 'hint', 'error']
})
export class SliderComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Label text */
	label = '';

	/** Current value */
	value = 50;

	/** Minimum value */
	min = 0;

	/** Maximum value */
	max = 100;

	/** Step increment */
	step = 1;

	/** Slider size */
	size: Size = 'md';

	/** Disable the slider */
	disabled = false;

	/** Show current value */
	showValue = false;

	/** Hint text */
	hint = '';

	/** Error message */
	error = '';

	/** Ratio 0–1 for fill track */
	get ratio(): number {
		const range = this.max - this.min;
		if (range <= 0) return 0;
		return (this.value - this.min) / range;
	}

	/** CSS width for fill that matches native thumb position */
	get fillWidth(): string {
		const p = this.ratio;
		return `calc(${p * 100}% + ${10 - p * 20}px)`;
	}

	handleInput = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = Number(target.value);

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:input', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};

	handleChange = (event: Event): void => {
		const target = event.target as HTMLInputElement;
		this.value = Number(target.value);

		this.elementRef.dispatchEvent(
			new CustomEvent('ml:change', {
				bubbles: true,
				composed: true,
				detail: { value: this.value }
			})
		);
	};
}
