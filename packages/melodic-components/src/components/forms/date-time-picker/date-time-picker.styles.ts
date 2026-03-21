import { css } from '@melodicdev/core';

export const dateTimePickerStyles = () => css`
	:host {
		display: block;

		/* --- Label --- */
		--ml-date-time-picker-label-font-size: var(--ml-text-sm);
		--ml-date-time-picker-label-font-weight: var(--ml-font-medium);
		--ml-date-time-picker-label-color: var(--ml-color-text-secondary);
		--ml-date-time-picker-label-line-height: var(--ml-leading-tight);
		--ml-date-time-picker-label-margin-bottom: var(--ml-space-1-5);

		/* --- Required indicator --- */
		--ml-date-time-picker-required-color: var(--ml-color-danger);

		/* --- Row (unified input border) --- */
		--ml-date-time-picker-border-width: var(--ml-border);
		--ml-date-time-picker-border-color: var(--ml-color-border);
		--ml-date-time-picker-border-radius: var(--ml-radius-md);
		--ml-date-time-picker-bg: var(--ml-color-input-bg);

		/* --- Focus --- */
		--ml-date-time-picker-focus-border-color: var(--ml-color-primary);
		--ml-date-time-picker-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Error --- */
		--ml-date-time-picker-error-border-color: var(--ml-color-danger);
		--ml-date-time-picker-error-focus-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
		--ml-date-time-picker-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-date-time-picker-disabled-opacity: 0.5;
		--ml-date-time-picker-disabled-bg: var(--ml-color-surface-sunken);

		/* --- Divider --- */
		--ml-date-time-picker-divider-color: var(--ml-color-border);

		/* --- Hint --- */
		--ml-date-time-picker-hint-color: var(--ml-color-text-muted);
		--ml-date-time-picker-hint-font-size: var(--ml-text-sm);

		/* --- Transition --- */
		--ml-date-time-picker-transition-duration: var(--ml-duration-150);
		--ml-date-time-picker-transition-easing: var(--ml-ease-in-out);
	}

	/* Label */
	.ml-date-time-picker__label {
		display: block;
		font-size: var(--ml-date-time-picker-label-font-size);
		font-weight: var(--ml-date-time-picker-label-font-weight);
		color: var(--ml-date-time-picker-label-color);
		margin-bottom: var(--ml-date-time-picker-label-margin-bottom);
		line-height: var(--ml-date-time-picker-label-line-height);
	}

	.ml-date-time-picker__required {
		color: var(--ml-date-time-picker-required-color);
		margin-left: var(--ml-space-0-5);
	}

	/* Unified row -- acts as the single input border */
	.ml-date-time-picker__row {
		display: flex;
		align-items: stretch;
		border: var(--ml-date-time-picker-border-width) solid var(--ml-date-time-picker-border-color);
		border-radius: var(--ml-date-time-picker-border-radius);
		background-color: var(--ml-date-time-picker-bg);
		transition:
			border-color var(--ml-date-time-picker-transition-duration) var(--ml-date-time-picker-transition-easing),
			box-shadow var(--ml-date-time-picker-transition-duration) var(--ml-date-time-picker-transition-easing);
	}

	.ml-date-time-picker__row:focus-within {
		border-color: var(--ml-date-time-picker-focus-border-color);
		box-shadow: var(--ml-date-time-picker-focus-shadow);
	}

	.ml-date-time-picker--error .ml-date-time-picker__row {
		border-color: var(--ml-date-time-picker-error-border-color);
	}

	.ml-date-time-picker--error .ml-date-time-picker__row:focus-within {
		box-shadow: var(--ml-date-time-picker-error-focus-shadow);
	}

	/* Child pickers -- strip their individual borders, hover borders & focus rings */
	.ml-date-time-picker__row > ml-date-picker,
	.ml-date-time-picker__row > ml-time-picker {
		flex: 1;
		min-width: 0;
		--ml-color-border: transparent;
		--ml-color-border-strong: transparent;
		--ml-trigger-focus-border: transparent;
		--ml-shadow-focus-ring: none;
	}

	/* Vertical divider between pickers */
	.ml-date-time-picker__divider {
		width: 1px;
		align-self: stretch;
		background-color: var(--ml-date-time-picker-divider-color);
		margin: var(--ml-space-1-5) 0;
		flex-shrink: 0;
	}

	/* Disabled */
	.ml-date-time-picker--disabled .ml-date-time-picker__row {
		opacity: var(--ml-date-time-picker-disabled-opacity);
		pointer-events: none;
		background-color: var(--ml-date-time-picker-disabled-bg);
	}

	/* Hint / Error */
	.ml-date-time-picker__hint,
	.ml-date-time-picker__error {
		display: block;
		margin-top: var(--ml-date-time-picker-label-margin-bottom);
		font-size: var(--ml-date-time-picker-hint-font-size);
		line-height: var(--ml-date-time-picker-label-line-height);
	}

	.ml-date-time-picker__hint {
		color: var(--ml-date-time-picker-hint-color);
	}

	.ml-date-time-picker__error {
		color: var(--ml-date-time-picker-error-color);
	}
`;
