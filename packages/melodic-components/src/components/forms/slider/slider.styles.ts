import { css } from '@melodicdev/core';

export const sliderStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label / Value
	 * --ml-slider-label-font-size: var(--ml-text-sm)
	 * --ml-slider-label-font-weight: var(--ml-font-medium)
	 * --ml-slider-label-color: var(--ml-color-text)
	 *
	 * Track
	 * --ml-slider-track-height: 6px
	 * --ml-slider-track-bg: var(--ml-color-surface-hover)
	 * --ml-slider-track-border-radius: var(--ml-radius-full)
	 *
	 * Fill
	 * --ml-slider-fill-color: var(--ml-color-primary)
	 *
	 * Thumb
	 * --ml-slider-thumb-size: 20px
	 * --ml-slider-thumb-bg: var(--ml-color-surface)
	 * --ml-slider-thumb-border-width: 2px
	 * --ml-slider-thumb-border-color: var(--ml-color-primary)
	 * --ml-slider-thumb-border-radius: var(--ml-radius-full)
	 * --ml-slider-thumb-shadow: var(--ml-shadow-sm)
	 * --ml-slider-thumb-hover-shadow: var(--ml-shadow-md)
	 * --ml-slider-thumb-focus-shadow: 0 0 0 3px var(--ml-color-primary-subtle)
	 *
	 * Error
	 * --ml-slider-error-fill-color: var(--ml-color-danger)
	 * --ml-slider-error-thumb-border-color: var(--ml-color-danger)
	 * --ml-slider-error-color: var(--ml-color-danger)
	 *
	 * Hint
	 * --ml-slider-hint-font-size: var(--ml-text-sm)
	 * --ml-slider-hint-color: var(--ml-color-text-tertiary)
	 *
	 * Disabled
	 * --ml-slider-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-slider-transition-duration: var(--ml-duration-150)
	 * --ml-slider-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-slider__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--ml-space-2);
	}

	.ml-slider__label {
		font-size: var(--ml-slider-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-slider-label-font-weight, var(--ml-font-medium));
		color: var(--ml-slider-label-color, var(--ml-color-text));
	}

	.ml-slider__value {
		font-size: var(--ml-slider-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-slider-label-font-weight, var(--ml-font-medium));
		color: var(--ml-slider-label-color, var(--ml-color-text));
	}

	.ml-slider__track-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.ml-slider__track {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		pointer-events: none;
	}

	.ml-slider__track::before {
		content: '';
		position: absolute;
		width: 100%;
		height: var(--ml-slider-track-height, 6px);
		background-color: var(--ml-slider-track-bg, var(--ml-color-surface-hover));
		border-radius: var(--ml-slider-track-border-radius, var(--ml-radius-full));
	}

	.ml-slider--sm .ml-slider__track::before {
		height: 4px;
	}

	.ml-slider--md .ml-slider__track::before {
		height: 6px;
	}

	.ml-slider--lg .ml-slider__track::before {
		height: 8px;
	}

	.ml-slider__fill {
		position: absolute;
		left: 0;
		height: var(--ml-slider-track-height, 6px);
		background-color: var(--ml-slider-fill-color, var(--ml-color-primary));
		border-radius: var(--ml-slider-track-border-radius, var(--ml-radius-full));
		pointer-events: none;
	}

	.ml-slider--sm .ml-slider__fill {
		height: 4px;
	}

	.ml-slider--md .ml-slider__fill {
		height: 6px;
	}

	.ml-slider--lg .ml-slider__fill {
		height: 8px;
	}

	.ml-slider--error .ml-slider__fill {
		background-color: var(--ml-slider-error-fill-color, var(--ml-color-danger));
	}

	/* Native range input - overlays the track */
	.ml-slider__input {
		width: 100%;
		margin: 0;
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
		position: relative;
		z-index: 1;
	}

	.ml-slider__input:disabled {
		cursor: not-allowed;
		opacity: var(--ml-slider-disabled-opacity, 0.5);
	}

	/* Webkit thumb */
	.ml-slider__input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: var(--ml-slider-thumb-size, 20px);
		height: var(--ml-slider-thumb-size, 20px);
		border-radius: var(--ml-slider-thumb-border-radius, var(--ml-radius-full));
		background-color: var(--ml-slider-thumb-bg, var(--ml-color-surface));
		border: var(--ml-slider-thumb-border-width, 2px) solid var(--ml-slider-thumb-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-slider-thumb-shadow, var(--ml-shadow-sm));
		transition:
			box-shadow var(--ml-slider-transition-duration, var(--ml-duration-150)) var(--ml-slider-transition-easing, var(--ml-ease-in-out)),
			transform var(--ml-slider-transition-duration, var(--ml-duration-150)) var(--ml-slider-transition-easing, var(--ml-ease-in-out));
	}

	.ml-slider__input:hover::-webkit-slider-thumb {
		box-shadow: var(--ml-slider-thumb-hover-shadow, var(--ml-shadow-md));
		transform: scale(1.1);
	}

	.ml-slider__input:focus-visible::-webkit-slider-thumb {
		box-shadow: var(--ml-slider-thumb-focus-shadow, 0 0 0 3px var(--ml-color-primary-subtle));
	}

	.ml-slider--error .ml-slider__input::-webkit-slider-thumb {
		border-color: var(--ml-slider-error-thumb-border-color, var(--ml-color-danger));
	}

	/* Firefox thumb */
	.ml-slider__input::-moz-range-thumb {
		width: var(--ml-slider-thumb-size, 20px);
		height: var(--ml-slider-thumb-size, 20px);
		border-radius: var(--ml-slider-thumb-border-radius, var(--ml-radius-full));
		background-color: var(--ml-slider-thumb-bg, var(--ml-color-surface));
		border: var(--ml-slider-thumb-border-width, 2px) solid var(--ml-slider-thumb-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-slider-thumb-shadow, var(--ml-shadow-sm));
	}

	.ml-slider--error .ml-slider__input::-moz-range-thumb {
		border-color: var(--ml-slider-error-thumb-border-color, var(--ml-color-danger));
	}

	/* Hide browser track (we use custom track) */
	.ml-slider__input::-webkit-slider-runnable-track {
		height: var(--ml-slider-thumb-size, 20px);
		background: transparent;
	}

	.ml-slider__input::-moz-range-track {
		height: var(--ml-slider-thumb-size, 20px);
		background: transparent;
		border: none;
	}

	.ml-slider__hint {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-slider-hint-font-size, var(--ml-text-sm));
		color: var(--ml-slider-hint-color, var(--ml-color-text-tertiary));
	}

	.ml-slider__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-slider-hint-font-size, var(--ml-text-sm));
		color: var(--ml-slider-error-color, var(--ml-color-danger));
	}
`;
