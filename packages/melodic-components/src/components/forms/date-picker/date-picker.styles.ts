import { css } from '@melodicdev/core';

export const datePickerStyles = () => css`
	:host {
		display: block;
	}

	/* Label */
	.ml-date-picker__label {
		display: block;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		margin-bottom: var(--ml-space-1-5);
		line-height: var(--ml-leading-tight);
	}

	.ml-date-picker__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	/* Trigger button */
	.ml-date-picker__trigger {
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

	.ml-date-picker__trigger:hover:not(:disabled) {
		border-color: var(--ml-color-border-strong);
	}

	.ml-date-picker__trigger:focus-visible {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-date-picker--open .ml-date-picker__trigger {
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-date-picker--error .ml-date-picker__trigger {
		border-color: var(--ml-color-danger);
	}

	.ml-date-picker--error .ml-date-picker__trigger:focus-visible,
	.ml-date-picker--error.ml-date-picker--open .ml-date-picker__trigger {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}

	.ml-date-picker--disabled .ml-date-picker__trigger {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: var(--ml-color-surface-sunken);
	}

	/* Sizes */
	.ml-date-picker--sm .ml-date-picker__trigger {
		padding: var(--ml-space-1-5) var(--ml-space-2-5);
		font-size: var(--ml-text-xs);
	}

	.ml-date-picker--md .ml-date-picker__trigger {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-date-picker--lg .ml-date-picker__trigger {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
		font-size: var(--ml-text-base);
	}

	/* Icon */
	.ml-date-picker__icon {
		flex-shrink: 0;
		color: var(--ml-color-text-muted);
	}

	/* Value */
	.ml-date-picker__value {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.ml-date-picker__value--placeholder {
		color: var(--ml-color-text-muted);
	}

	/* Popover */
	.ml-date-picker__popover {
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
		margin-top: var(--ml-space-1-5);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-date-picker__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-date-picker__error {
		color: var(--ml-color-danger);
	}
`;
