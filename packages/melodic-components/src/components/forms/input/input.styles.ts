import { css } from '@melodicdev/core';

export const inputStyles = () => css`
	:host {
		display: block;
		width: 100%;
	}

	.ml-input {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1.5);
	}

	/* Label */
	.ml-input__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-tight);
	}

	.ml-input__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0.5);
	}

	/* Wrapper */
	.ml-input__wrapper {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		background-color: var(--ml-color-input-bg);
		border: var(--ml-border) solid var(--ml-color-border-strong);
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-xs);
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-input__wrapper:hover:not(.ml-input--disabled .ml-input__wrapper) {
		border-color: var(--ml-color-border);
	}

	.ml-input--focused .ml-input__wrapper {
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-input--error .ml-input__wrapper {
		border-color: var(--ml-color-danger);
	}

	.ml-input--error.ml-input--focused .ml-input__wrapper {
		box-shadow: var(--ml-shadow-ring-error);
	}

	.ml-input--disabled .ml-input__wrapper {
		background-color: var(--ml-color-input-disabled-bg);
		cursor: not-allowed;
	}

	/* Field */
	.ml-input__field {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: var(--ml-color-text);
		font-family: var(--ml-font-sans);
		font-size: inherit;
		line-height: var(--ml-leading-normal);
	}

	.ml-input__field:focus {
		outline: none;
	}

	.ml-input__field::placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-input__field:disabled {
		cursor: not-allowed;
		color: var(--ml-color-text-muted);
	}

	/* Sizes */
	.ml-input--sm .ml-input__wrapper {
		padding: var(--ml-space-2) var(--ml-space-3);
	}

	.ml-input--sm .ml-input__field {
		font-size: var(--ml-text-sm);
	}

	.ml-input--md .ml-input__wrapper {
		padding: var(--ml-space-2.5) var(--ml-space-3.5);
	}

	.ml-input--md .ml-input__field {
		font-size: var(--ml-text-sm);
	}

	.ml-input--lg .ml-input__wrapper {
		padding: var(--ml-space-3) var(--ml-space-3.5);
	}

	.ml-input--lg .ml-input__field {
		font-size: var(--ml-text-base);
	}

	/* Hint & Error */
	.ml-input__hint,
	.ml-input__error {
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-input__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-input__error {
		color: var(--ml-color-danger);
	}

	/* Slots */
	::slotted([slot='prefix']),
	::slotted([slot='suffix']) {
		display: flex;
		align-items: center;
		color: var(--ml-color-text-muted);
		flex-shrink: 0;
	}
`;
