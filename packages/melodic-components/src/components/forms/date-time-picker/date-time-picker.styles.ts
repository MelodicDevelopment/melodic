import { css } from '@melodicdev/core';

export const dateTimePickerStyles = () => css`
	:host {
		display: block;
	}

	/* Label */
	.ml-date-time-picker__label {
		display: block;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		margin-bottom: var(--ml-space-1-5);
		line-height: var(--ml-leading-tight);
	}

	.ml-date-time-picker__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	/* Unified row — acts as the single input border */
	.ml-date-time-picker__row {
		display: flex;
		align-items: stretch;
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background-color: var(--ml-color-input-bg);
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-date-time-picker__row:focus-within {
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-date-time-picker--error .ml-date-time-picker__row {
		border-color: var(--ml-color-danger);
	}

	.ml-date-time-picker--error .ml-date-time-picker__row:focus-within {
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
	}

	/* Child pickers — strip their individual borders, hover borders & focus rings */
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
		background-color: var(--ml-color-border);
		margin: var(--ml-space-1-5) 0;
		flex-shrink: 0;
	}

	/* Disabled */
	.ml-date-time-picker--disabled .ml-date-time-picker__row {
		opacity: 0.5;
		pointer-events: none;
		background-color: var(--ml-color-surface-sunken);
	}

	/* Hint / Error */
	.ml-date-time-picker__hint,
	.ml-date-time-picker__error {
		display: block;
		margin-top: var(--ml-space-1-5);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-date-time-picker__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-date-time-picker__error {
		color: var(--ml-color-danger);
	}
`;
