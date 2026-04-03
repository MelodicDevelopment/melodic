import { css } from '@melodicdev/core';

export const datePickerStyles = () => css`
	:host {
		display: block;

		/* --- Label --- */
		--ml-date-picker-label-font-size: var(--ml-text-sm);
		--ml-date-picker-label-font-weight: var(--ml-font-medium);
		--ml-date-picker-label-color: var(--ml-color-text-secondary);
		--ml-date-picker-label-line-height: var(--ml-leading-tight);
		--ml-date-picker-label-margin-bottom: var(--ml-space-1-5);

		/* --- Required indicator --- */
		--ml-date-picker-required-color: var(--ml-color-danger);

		/* --- Trigger --- */
		--ml-date-picker-bg: var(--ml-color-input-bg);
		--ml-date-picker-border-width: var(--ml-border);
		--ml-date-picker-border-color: var(--ml-color-border);
		--ml-date-picker-border-radius: var(--ml-radius);
		--ml-date-picker-color: var(--ml-color-text);
		--ml-date-picker-font-family: var(--ml-font-sans);
		--ml-date-picker-font-size: var(--ml-text-sm);
		--ml-date-picker-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-date-picker-gap: var(--ml-space-2);
		--ml-date-picker-hover-border-color: var(--ml-color-border-strong);

		/* --- Focus --- */
		--ml-date-picker-focus-border-color: var(--ml-trigger-focus-border, var(--ml-color-primary));
		--ml-date-picker-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Error --- */
		--ml-date-picker-error-border-color: var(--ml-color-danger);
		--ml-date-picker-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-date-picker-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-date-picker-disabled-opacity: 0.5;
		--ml-date-picker-disabled-bg: var(--ml-color-input-disabled-bg);

		/* --- Icon --- */
		--ml-date-picker-icon-color: var(--ml-color-text-muted);

		/* --- Placeholder --- */
		--ml-date-picker-placeholder-color: var(--ml-color-text-muted);

		/* --- Popover --- */
		--ml-date-picker-popover-padding: var(--ml-space-4);
		--ml-date-picker-popover-border-color: var(--ml-color-border);
		--ml-date-picker-popover-border-radius: var(--ml-radius-lg);
		--ml-date-picker-popover-bg: var(--ml-color-surface);
		--ml-date-picker-popover-shadow: var(--ml-shadow-lg);

		/* --- Hint --- */
		--ml-date-picker-hint-color: var(--ml-color-text-muted);
		--ml-date-picker-hint-font-size: var(--ml-text-sm);

		/* --- Transition --- */
		--ml-date-picker-transition-duration: var(--ml-duration-150);
		--ml-date-picker-transition-easing: var(--ml-ease-in-out);
	}

	/* Label */
	.ml-date-picker__label {
		display: block;
		font-size: var(--ml-date-picker-label-font-size);
		font-weight: var(--ml-date-picker-label-font-weight);
		color: var(--ml-date-picker-label-color);
		margin-bottom: var(--ml-date-picker-label-margin-bottom);
		line-height: var(--ml-date-picker-label-line-height);
	}

	.ml-date-picker__required {
		color: var(--ml-date-picker-required-color);
		margin-left: var(--ml-space-0-5);
	}

	/* Trigger wrapper */
	.ml-date-picker__trigger {
		display: flex;
		align-items: center;
		width: 100%;
		border: var(--ml-date-picker-border-width) solid var(--ml-date-picker-border-color);
		border-radius: var(--ml-date-picker-border-radius);
		background-color: var(--ml-date-picker-bg);
		transition:
			border-color var(--ml-date-picker-transition-duration) var(--ml-date-picker-transition-easing),
			box-shadow var(--ml-date-picker-transition-duration) var(--ml-date-picker-transition-easing);
	}

	.ml-date-picker__trigger:hover:not(:has(:disabled)) {
		border-color: var(--ml-date-picker-hover-border-color);
	}

	.ml-date-picker__trigger:focus-within {
		border-color: var(--ml-date-picker-focus-border-color);
		box-shadow: var(--ml-date-picker-focus-shadow);
	}

	.ml-date-picker--open .ml-date-picker__trigger {
		border-color: var(--ml-date-picker-focus-border-color);
		box-shadow: var(--ml-date-picker-focus-shadow);
	}

	.ml-date-picker--error .ml-date-picker__trigger {
		border-color: var(--ml-date-picker-error-border-color);
	}

	.ml-date-picker--error .ml-date-picker__trigger:focus-within,
	.ml-date-picker--error.ml-date-picker--open .ml-date-picker__trigger {
		box-shadow: var(--ml-date-picker-error-focus-shadow);
	}

	.ml-date-picker--disabled .ml-date-picker__trigger {
		opacity: var(--ml-date-picker-disabled-opacity);
		cursor: not-allowed;
		background-color: var(--ml-date-picker-disabled-bg);
	}

	/* Date input */
	.ml-date-picker__input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--ml-date-picker-color);
		font-family: var(--ml-date-picker-font-family);
		font-size: var(--ml-date-picker-font-size);
		padding: var(--ml-date-picker-padding);
	}

	/* Hide native date picker indicator across browsers */
	.ml-date-picker__input::-webkit-calendar-picker-indicator {
		display: none;
		-webkit-appearance: none;
	}

	.ml-date-picker__input::-webkit-date-and-time-value {
		text-align: left;
	}

	.ml-date-picker__input:disabled {
		cursor: not-allowed;
	}

	/* Sizes */
	.ml-date-picker--sm .ml-date-picker__input {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-date-picker--md .ml-date-picker__input {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
	}

	.ml-date-picker--lg .ml-date-picker__input {
		padding: var(--ml-space-3) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Calendar button */
	.ml-date-picker__calendar-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0 var(--ml-space-3) 0 0;
		color: var(--ml-date-picker-icon-color);
		transition: color var(--ml-date-picker-transition-duration) var(--ml-date-picker-transition-easing);
	}

	.ml-date-picker__calendar-btn:hover:not(:disabled) {
		color: var(--ml-date-picker-color);
	}

	.ml-date-picker__calendar-btn:disabled {
		cursor: not-allowed;
	}

	/* Icon */
	.ml-date-picker__icon {
		flex-shrink: 0;
	}

	/* Popover */
	.ml-date-picker__popover {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-date-picker-popover-padding);
		border: var(--ml-date-picker-border-width) solid var(--ml-date-picker-popover-border-color);
		border-radius: var(--ml-date-picker-popover-border-radius);
		background-color: var(--ml-date-picker-popover-bg);
		box-shadow: var(--ml-date-picker-popover-shadow);
		z-index: 50;

		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-date-picker-transition-duration) var(--ml-ease-out),
			transform var(--ml-date-picker-transition-duration) var(--ml-ease-out),
			display var(--ml-date-picker-transition-duration) allow-discrete;
	}

	.ml-date-picker__popover:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-date-picker__popover:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	/* Hint / Error */
	.ml-date-picker__hint,
	.ml-date-picker__error {
		display: block;
		margin-top: var(--ml-date-picker-label-margin-bottom);
		font-size: var(--ml-date-picker-hint-font-size);
		line-height: var(--ml-date-picker-label-line-height);
	}

	.ml-date-picker__hint {
		color: var(--ml-date-picker-hint-color);
	}

	.ml-date-picker__error {
		color: var(--ml-date-picker-error-color);
	}
`;
