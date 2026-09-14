import { css } from '@melodicdev/core';

export const timePickerStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-time-picker-label-font-size: var(--ml-text-sm)
	 * --ml-time-picker-label-font-weight: var(--ml-font-medium)
	 * --ml-time-picker-label-color: var(--ml-color-text-secondary)
	 * --ml-time-picker-label-line-height: var(--ml-leading-tight)
	 * --ml-time-picker-label-margin-bottom: var(--ml-space-1-5)
	 *
	 * Required indicator
	 * --ml-time-picker-required-color: var(--ml-color-danger)
	 *
	 * Trigger
	 * --ml-time-picker-bg: var(--ml-color-input-bg)
	 * --ml-time-picker-border-width: var(--ml-border)
	 * --ml-time-picker-border-color: var(--ml-color-border)
	 * --ml-time-picker-border-radius: var(--ml-radius)
	 * --ml-time-picker-color: var(--ml-color-text)
	 * --ml-time-picker-font-family: var(--ml-font-sans)
	 * --ml-time-picker-font-size: var(--ml-text-sm)
	 * --ml-time-picker-padding: var(--ml-space-2-5) var(--ml-space-3-5)
	 * --ml-time-picker-hover-border-color: var(--ml-color-border-strong)
	 *
	 * Focus
	 * --ml-time-picker-focus-border-color: var(--ml-trigger-focus-border, var(--ml-color-primary))
	 * --ml-time-picker-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Error
	 * --ml-time-picker-error-border-color: var(--ml-color-danger)
	 * --ml-time-picker-error-focus-shadow: var(--ml-shadow-ring-error)
	 * --ml-time-picker-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-time-picker-disabled-opacity: 0.5
	 * --ml-time-picker-disabled-bg: var(--ml-color-input-disabled-bg)
	 *
	 * Icon
	 * --ml-time-picker-icon-color: var(--ml-color-text-muted)
	 *
	 * Popover
	 * --ml-time-picker-popover-padding: var(--ml-space-4)
	 * --ml-time-picker-popover-border-color: var(--ml-color-border)
	 * --ml-time-picker-popover-border-radius: var(--ml-radius-lg)
	 * --ml-time-picker-popover-bg: var(--ml-color-surface)
	 * --ml-time-picker-popover-shadow: var(--ml-shadow-lg)
	 *
	 * Spinner
	 * --ml-time-picker-spin-btn-size: 2rem
	 * --ml-time-picker-spin-btn-color: var(--ml-color-text-muted)
	 * --ml-time-picker-spin-btn-hover-bg: var(--ml-color-surface-raised)
	 * --ml-time-picker-spin-btn-hover-color: var(--ml-color-text)
	 * --ml-time-picker-spin-btn-border-radius: var(--ml-radius-md)
	 * --ml-time-picker-spin-input-width: 3rem
	 * --ml-time-picker-spin-input-height: 2.5rem
	 * --ml-time-picker-spin-input-font-size: var(--ml-text-xl)
	 * --ml-time-picker-spin-input-font-weight: var(--ml-font-semibold)
	 * --ml-time-picker-spin-input-font-family: var(--ml-font-mono, var(--ml-font-sans))
	 * --ml-time-picker-spin-input-color: var(--ml-color-text)
	 * --ml-time-picker-spin-input-bg: var(--ml-color-surface-sunken)
	 * --ml-time-picker-spin-input-border-radius: var(--ml-radius-md)
	 * --ml-time-picker-spin-input-focus-border-color: var(--ml-color-primary)
	 * --ml-time-picker-spin-input-focus-bg: var(--ml-color-surface)
	 *
	 * Separator
	 * --ml-time-picker-separator-font-size: var(--ml-text-xl)
	 * --ml-time-picker-separator-font-weight: var(--ml-font-semibold)
	 * --ml-time-picker-separator-color: var(--ml-color-text-muted)
	 *
	 * Period button
	 * --ml-time-picker-period-bg: var(--ml-color-surface)
	 * --ml-time-picker-period-border-color: var(--ml-color-border)
	 * --ml-time-picker-period-border-radius: var(--ml-radius-md)
	 * --ml-time-picker-period-font-size: var(--ml-text-sm)
	 * --ml-time-picker-period-font-weight: var(--ml-font-semibold)
	 * --ml-time-picker-period-color: var(--ml-color-text)
	 * --ml-time-picker-period-hover-bg: var(--ml-color-surface-raised)
	 * --ml-time-picker-period-hover-border-color: var(--ml-color-border-strong)
	 *
	 * Footer buttons
	 * --ml-time-picker-footer-btn-bg: var(--ml-color-surface)
	 * --ml-time-picker-footer-btn-border-color: var(--ml-color-border)
	 * --ml-time-picker-footer-btn-border-radius: var(--ml-radius-md)
	 * --ml-time-picker-footer-btn-font-size: var(--ml-text-sm)
	 * --ml-time-picker-footer-btn-font-weight: var(--ml-font-medium)
	 * --ml-time-picker-footer-btn-color: var(--ml-color-text)
	 * --ml-time-picker-footer-btn-hover-bg: var(--ml-color-surface-raised)
	 * --ml-time-picker-footer-btn-hover-border-color: var(--ml-color-border-strong)
	 * --ml-time-picker-confirm-bg: var(--ml-color-primary)
	 * --ml-time-picker-confirm-border-color: var(--ml-color-primary)
	 * --ml-time-picker-confirm-color: var(--ml-color-text-inverse)
	 * --ml-time-picker-confirm-hover-bg: var(--ml-color-primary-hover)
	 * --ml-time-picker-confirm-hover-border-color: var(--ml-color-primary-hover)
	 *
	 * Hint
	 * --ml-time-picker-hint-color: var(--ml-color-text-muted)
	 * --ml-time-picker-hint-font-size: var(--ml-text-sm)
	 *
	 * Transition
	 * --ml-time-picker-transition-duration: var(--ml-duration-150)
	 * --ml-time-picker-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;

		--ml-time-picker-gap: var(--ml-space-2);

		/* --- Placeholder --- */
		--ml-time-picker-placeholder-color: var(--ml-color-text-muted);
	}

	/* Label */
	.ml-time-picker__label {
		display: block;
		font-size: var(--ml-time-picker-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-time-picker-label-font-weight, var(--ml-font-medium));
		color: var(--ml-time-picker-label-color, var(--ml-color-text-secondary));
		margin-bottom: var(--ml-time-picker-label-margin-bottom, var(--ml-space-1-5));
		line-height: var(--ml-time-picker-label-line-height, var(--ml-leading-tight));
	}

	.ml-time-picker__required {
		color: var(--ml-time-picker-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	/* Trigger wrapper */
	.ml-time-picker__trigger {
		display: flex;
		align-items: center;
		width: 100%;
		border: var(--ml-time-picker-border-width, var(--ml-border)) solid var(--ml-time-picker-border-color, var(--ml-color-border));
		border-radius: var(--ml-time-picker-border-radius, var(--ml-radius));
		background-color: var(--ml-time-picker-bg, var(--ml-color-input-bg));
		transition:
			border-color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out));
	}

	.ml-time-picker__trigger:hover:not(:has(:disabled)) {
		border-color: var(--ml-time-picker-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-time-picker__trigger:focus-within {
		border-color: var(--ml-time-picker-focus-border-color, var(--ml-trigger-focus-border, var(--ml-color-primary)));
		box-shadow: var(--ml-time-picker-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-time-picker--open .ml-time-picker__trigger {
		border-color: var(--ml-time-picker-focus-border-color, var(--ml-trigger-focus-border, var(--ml-color-primary)));
		box-shadow: var(--ml-time-picker-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-time-picker--error .ml-time-picker__trigger {
		border-color: var(--ml-time-picker-error-border-color, var(--ml-color-danger));
	}

	.ml-time-picker--error .ml-time-picker__trigger:focus-within,
	.ml-time-picker--error.ml-time-picker--open .ml-time-picker__trigger {
		box-shadow: var(--ml-time-picker-error-focus-shadow, var(--ml-shadow-ring-error));
	}

	.ml-time-picker--disabled .ml-time-picker__trigger {
		opacity: var(--ml-time-picker-disabled-opacity, 0.5);
		cursor: not-allowed;
		background-color: var(--ml-time-picker-disabled-bg, var(--ml-color-input-disabled-bg));
	}

	/* Time input */
	.ml-time-picker__input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		background: transparent;
		color: var(--ml-time-picker-color, var(--ml-color-text));
		font-family: var(--ml-time-picker-font-family, var(--ml-font-sans));
		font-size: var(--ml-time-picker-font-size, var(--ml-text-sm));
		padding: var(--ml-time-picker-padding, var(--ml-space-2-5) var(--ml-space-3-5));
	}

	/* Hide native time picker indicator across browsers */
	.ml-time-picker__input::-webkit-calendar-picker-indicator {
		display: none;
		-webkit-appearance: none;
	}

	.ml-time-picker__input::-webkit-date-and-time-value {
		text-align: left;
	}

	.ml-time-picker__input:disabled {
		cursor: not-allowed;
	}

	/* Sizes */
	.ml-time-picker--sm .ml-time-picker__input {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-time-picker--md .ml-time-picker__input {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
	}

	.ml-time-picker--lg .ml-time-picker__input {
		padding: var(--ml-space-3) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Clock button */
	.ml-time-picker__clock-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0 var(--ml-space-3) 0 0;
		color: var(--ml-time-picker-icon-color, var(--ml-color-text-muted));
		transition: color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out));
	}

	.ml-time-picker__clock-btn:hover:not(:disabled) {
		color: var(--ml-time-picker-color, var(--ml-color-text));
	}

	.ml-time-picker__clock-btn:disabled {
		cursor: not-allowed;
	}

	/* Icon */
	.ml-time-picker__icon {
		flex-shrink: 0;
	}

	/* Popover */
	.ml-time-picker__popover {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-time-picker-popover-padding, var(--ml-space-4));
		border: var(--ml-time-picker-border-width, var(--ml-border)) solid var(--ml-time-picker-popover-border-color, var(--ml-color-border));
		border-radius: var(--ml-time-picker-popover-border-radius, var(--ml-radius-lg));
		background-color: var(--ml-time-picker-popover-bg, var(--ml-color-surface));
		box-shadow: var(--ml-time-picker-popover-shadow, var(--ml-shadow-lg));
		z-index: 50;

		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-ease-out),
			transform var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-ease-out),
			display var(--ml-time-picker-transition-duration, var(--ml-duration-150)) allow-discrete;
	}

	.ml-time-picker__popover:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-time-picker__popover:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	/* Spinner group */
	.ml-time-picker__spinner-group {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
		justify-content: center;
	}

	.ml-time-picker__spinner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-time-picker__spin-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-time-picker-spin-btn-size, 2rem);
		height: var(--ml-time-picker-spin-btn-size, 2rem);
		border: none;
		border-radius: var(--ml-time-picker-spin-btn-border-radius, var(--ml-radius-md));
		background: none;
		color: var(--ml-time-picker-spin-btn-color, var(--ml-color-text-muted));
		cursor: pointer;
		transition:
			background-color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out));
	}

	.ml-time-picker__spin-btn:hover {
		background-color: var(--ml-time-picker-spin-btn-hover-bg, var(--ml-color-surface-raised));
		color: var(--ml-time-picker-spin-btn-hover-color, var(--ml-color-text));
	}

	.ml-time-picker__spin-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-time-picker-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-time-picker__spin-input {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-time-picker-spin-input-width, 3rem);
		height: var(--ml-time-picker-spin-input-height, 2.5rem);
		font-size: var(--ml-time-picker-spin-input-font-size, var(--ml-text-xl));
		font-weight: var(--ml-time-picker-spin-input-font-weight, var(--ml-font-semibold));
		font-family: var(--ml-time-picker-spin-input-font-family, var(--ml-font-mono, var(--ml-font-sans)));
		color: var(--ml-time-picker-spin-input-color, var(--ml-color-text));
		background-color: var(--ml-time-picker-spin-input-bg, var(--ml-color-surface-sunken));
		border: var(--ml-time-picker-border-width, var(--ml-border)) solid transparent;
		border-radius: var(--ml-time-picker-spin-input-border-radius, var(--ml-radius-md));
		text-align: center;
		padding: 0;
		outline: none;
		-moz-appearance: textfield;
	}

	.ml-time-picker__spin-input::-webkit-outer-spin-button,
	.ml-time-picker__spin-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.ml-time-picker__spin-input:focus {
		border-color: var(--ml-time-picker-spin-input-focus-border-color, var(--ml-color-primary));
		background-color: var(--ml-time-picker-spin-input-focus-bg, var(--ml-color-surface));
	}

	.ml-time-picker__separator {
		font-size: var(--ml-time-picker-separator-font-size, var(--ml-text-xl));
		font-weight: var(--ml-time-picker-separator-font-weight, var(--ml-font-semibold));
		color: var(--ml-time-picker-separator-color, var(--ml-color-text-muted));
		padding: 0 var(--ml-space-0-5);
		align-self: center;
	}

	/* AM/PM toggle */
	.ml-time-picker__period {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-left: var(--ml-space-2);
	}

	.ml-time-picker__period-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--ml-space-1-5) var(--ml-space-2-5);
		border: var(--ml-time-picker-border-width, var(--ml-border)) solid var(--ml-time-picker-period-border-color, var(--ml-color-border));
		border-radius: var(--ml-time-picker-period-border-radius, var(--ml-radius-md));
		background-color: var(--ml-time-picker-period-bg, var(--ml-color-surface));
		font-family: var(--ml-time-picker-font-family, var(--ml-font-sans));
		font-size: var(--ml-time-picker-period-font-size, var(--ml-text-sm));
		font-weight: var(--ml-time-picker-period-font-weight, var(--ml-font-semibold));
		color: var(--ml-time-picker-period-color, var(--ml-color-text));
		cursor: pointer;
		transition:
			background-color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out)),
			border-color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out));
	}

	.ml-time-picker__period-btn:hover {
		background-color: var(--ml-time-picker-period-hover-bg, var(--ml-color-surface-raised));
		border-color: var(--ml-time-picker-period-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-time-picker__period-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-time-picker-focus-shadow, var(--ml-shadow-focus-ring));
	}

	/* Footer */
	.ml-time-picker__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--ml-space-3);
		margin-top: var(--ml-space-3);
		border-top: var(--ml-time-picker-border-width, var(--ml-border)) solid var(--ml-time-picker-popover-border-color, var(--ml-color-border));
	}

	.ml-time-picker__now-btn,
	.ml-time-picker__confirm-btn {
		border: var(--ml-time-picker-border-width, var(--ml-border)) solid var(--ml-time-picker-footer-btn-border-color, var(--ml-color-border));
		border-radius: var(--ml-time-picker-footer-btn-border-radius, var(--ml-radius-md));
		background-color: var(--ml-time-picker-footer-btn-bg, var(--ml-color-surface));
		font-family: var(--ml-time-picker-font-family, var(--ml-font-sans));
		font-size: var(--ml-time-picker-footer-btn-font-size, var(--ml-text-sm));
		font-weight: var(--ml-time-picker-footer-btn-font-weight, var(--ml-font-medium));
		color: var(--ml-time-picker-footer-btn-color, var(--ml-color-text));
		padding: var(--ml-space-1-5) var(--ml-space-3);
		cursor: pointer;
		transition:
			background-color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out)),
			border-color var(--ml-time-picker-transition-duration, var(--ml-duration-150)) var(--ml-time-picker-transition-easing, var(--ml-ease-in-out));
	}

	.ml-time-picker__now-btn:hover,
	.ml-time-picker__confirm-btn:hover {
		background-color: var(--ml-time-picker-footer-btn-hover-bg, var(--ml-color-surface-raised));
		border-color: var(--ml-time-picker-footer-btn-hover-border-color, var(--ml-color-border-strong));
	}

	.ml-time-picker__now-btn:focus-visible,
	.ml-time-picker__confirm-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-time-picker-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-time-picker__confirm-btn {
		background-color: var(--ml-time-picker-confirm-bg, var(--ml-color-primary));
		border-color: var(--ml-time-picker-confirm-border-color, var(--ml-color-primary));
		color: var(--ml-time-picker-confirm-color, var(--ml-color-text-inverse));
	}

	.ml-time-picker__confirm-btn:hover {
		background-color: var(--ml-time-picker-confirm-hover-bg, var(--ml-color-primary-hover));
		border-color: var(--ml-time-picker-confirm-hover-border-color, var(--ml-color-primary-hover));
	}

	/* Hint / Error */
	.ml-time-picker__hint,
	.ml-time-picker__error {
		display: block;
		margin-top: var(--ml-time-picker-label-margin-bottom, var(--ml-space-1-5));
		font-size: var(--ml-time-picker-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-time-picker-label-line-height, var(--ml-leading-tight));
	}

	.ml-time-picker__hint {
		color: var(--ml-time-picker-hint-color, var(--ml-color-text-muted));
	}

	.ml-time-picker__error {
		color: var(--ml-time-picker-error-color, var(--ml-color-danger));
	}
`;
