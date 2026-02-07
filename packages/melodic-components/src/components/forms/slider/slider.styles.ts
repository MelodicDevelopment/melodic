import { css } from '@melodicdev/core';

export const sliderStyles = () => css`
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
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
	}

	.ml-slider__value {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
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
		background-color: var(--ml-color-surface-hover);
		border-radius: var(--ml-radius-full);
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
		background-color: var(--ml-color-primary);
		border-radius: var(--ml-radius-full);
		pointer-events: none;
		transition: width var(--ml-duration-100) var(--ml-ease-out);
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
		background-color: var(--ml-color-error);
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
		opacity: 0.5;
	}

	/* Webkit thumb */
	.ml-slider__input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: var(--ml-radius-full);
		background-color: white;
		border: 2px solid var(--ml-color-primary);
		box-shadow: var(--ml-shadow-sm);
		transition:
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out),
			transform var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-slider__input:hover::-webkit-slider-thumb {
		box-shadow: var(--ml-shadow-md);
		transform: scale(1.1);
	}

	.ml-slider__input:focus-visible::-webkit-slider-thumb {
		box-shadow: 0 0 0 3px var(--ml-color-primary-subtle);
	}

	.ml-slider--error .ml-slider__input::-webkit-slider-thumb {
		border-color: var(--ml-color-error);
	}

	/* Firefox thumb */
	.ml-slider__input::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: var(--ml-radius-full);
		background-color: white;
		border: 2px solid var(--ml-color-primary);
		box-shadow: var(--ml-shadow-sm);
	}

	.ml-slider--error .ml-slider__input::-moz-range-thumb {
		border-color: var(--ml-color-error);
	}

	/* Hide browser track (we use custom track) */
	.ml-slider__input::-webkit-slider-runnable-track {
		height: 20px;
		background: transparent;
	}

	.ml-slider__input::-moz-range-track {
		height: 20px;
		background: transparent;
		border: none;
	}

	.ml-slider__hint {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-tertiary);
	}

	.ml-slider__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-error);
	}
`;
