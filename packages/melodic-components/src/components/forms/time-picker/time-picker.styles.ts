import { css } from '@melodicdev/core';

export const timePickerStyles = () => css`
	:host {
		display: block;
	}

	/* Label */
	.ml-time-picker__label {
		display: block;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		margin-bottom: var(--ml-space-1-5);
		line-height: var(--ml-leading-tight);
	}

	.ml-time-picker__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	/* Trigger button */
	.ml-time-picker__trigger {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		width: 100%;
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-color-input-bg);
		color: var(--ml-color-text);
		cursor: pointer;
		font-family: var(--ml-font-sans);
		text-align: left;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-time-picker__trigger:hover:not(:disabled) {
		border-color: var(--ml-color-border-strong);
	}

	.ml-time-picker__trigger:focus-visible {
		outline: none;
		border-color: var(--ml-trigger-focus-border, var(--ml-color-primary));
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-time-picker--open .ml-time-picker__trigger {
		border-color: var(--ml-trigger-focus-border, var(--ml-color-primary));
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-time-picker--error .ml-time-picker__trigger {
		border-color: var(--ml-color-danger);
	}

	.ml-time-picker--error .ml-time-picker__trigger:focus-visible,
	.ml-time-picker--error.ml-time-picker--open .ml-time-picker__trigger {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}

	.ml-time-picker--disabled .ml-time-picker__trigger {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--ml-color-surface-sunken);
	}

	/* Sizes */
	.ml-time-picker--sm .ml-time-picker__trigger {
		padding: var(--ml-space-1-5) var(--ml-space-2-5);
		font-size: var(--ml-text-xs);
	}

	.ml-time-picker--md .ml-time-picker__trigger {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-time-picker--lg .ml-time-picker__trigger {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Icon */
	.ml-time-picker__icon {
		flex-shrink: 0;
		color: var(--ml-color-text-muted);
	}

	/* Value */
	.ml-time-picker__value {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-time-picker__value--placeholder {
		color: var(--ml-color-text-muted);
	}

	/* Popover */
	.ml-time-picker__popover {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-space-4);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		background-color: var(--ml-color-surface);
		box-shadow: var(--ml-shadow-lg);
		z-index: 50;

		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-duration-150) var(--ml-ease-out),
			transform var(--ml-duration-150) var(--ml-ease-out),
			display var(--ml-duration-150) allow-discrete;
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
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: var(--ml-radius-md);
		background: none;
		color: var(--ml-color-text-muted);
		cursor: pointer;
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-time-picker__spin-btn:hover {
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text);
	}

	.ml-time-picker__spin-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-time-picker__spin-input {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 2.5rem;
		font-size: var(--ml-text-xl);
		font-weight: var(--ml-font-semibold);
		font-family: var(--ml-font-mono, var(--ml-font-sans));
		color: var(--ml-color-text);
		background-color: var(--ml-color-surface-sunken);
		border: var(--ml-border) solid transparent;
		border-radius: var(--ml-radius-md);
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
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-surface);
	}

	.ml-time-picker__separator {
		font-size: var(--ml-text-xl);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text-muted);
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
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-color-surface);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		cursor: pointer;
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-time-picker__period-btn:hover {
		background-color: var(--ml-color-surface-raised);
		border-color: var(--ml-color-border-strong);
	}

	.ml-time-picker__period-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	/* Footer */
	.ml-time-picker__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: var(--ml-space-3);
		margin-top: var(--ml-space-3);
		border-top: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-time-picker__now-btn,
	.ml-time-picker__confirm-btn {
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-color-surface);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		padding: var(--ml-space-1-5) var(--ml-space-3);
		cursor: pointer;
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-time-picker__now-btn:hover,
	.ml-time-picker__confirm-btn:hover {
		background-color: var(--ml-color-surface-raised);
		border-color: var(--ml-color-border-strong);
	}

	.ml-time-picker__now-btn:focus-visible,
	.ml-time-picker__confirm-btn:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-time-picker__confirm-btn {
		background-color: var(--ml-color-primary);
		border-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
	}

	.ml-time-picker__confirm-btn:hover {
		background-color: var(--ml-color-primary-hover);
		border-color: var(--ml-color-primary-hover);
	}

	/* Hint / Error */
	.ml-time-picker__hint,
	.ml-time-picker__error {
		display: block;
		margin-top: var(--ml-space-1-5);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-time-picker__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-time-picker__error {
		color: var(--ml-color-danger);
	}
`;
