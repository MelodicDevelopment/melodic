import { css } from '@melodicdev/core';

export const inputStyles = () => css`
	:host {
		display: block;
		width: 100%;
		min-width: 0;

		/* --- Label --- */
		--ml-input-label-font-size: var(--ml-text-sm);
		--ml-input-label-font-weight: var(--ml-font-medium);
		--ml-input-label-color: var(--ml-color-text-secondary);
		--ml-input-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-input-required-color: var(--ml-color-danger);

		/* --- Wrapper --- */
		--ml-input-bg: var(--ml-color-input-bg);
		--ml-input-border-width: var(--ml-border);
		--ml-input-border-color: var(--ml-color-border);
		--ml-input-border-radius: var(--ml-radius);
		--ml-input-shadow: none;
		--ml-input-hover-border-color: var(--ml-color-border);
		--ml-input-padding: var(--ml-space-2-5) var(--ml-space-3-5);
		--ml-input-gap: var(--ml-space-2);

		/* --- Field --- */
		--ml-input-color: var(--ml-color-text);
		--ml-input-font-family: var(--ml-font-sans);
		--ml-input-font-size: var(--ml-text-sm);
		--ml-input-line-height: var(--ml-leading-normal);
		--ml-input-placeholder-color: var(--ml-color-text-muted);

		/* --- Focus --- */
		--ml-input-focus-border-color: var(--ml-color-primary);
		--ml-input-focus-shadow: var(--ml-shadow-focus-ring);
		--ml-input-focus-inset-shadow: none;

		/* --- Error --- */
		--ml-input-error-border-color: var(--ml-color-danger);
		--ml-input-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-input-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-input-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-input-disabled-color: var(--ml-color-text-muted);

		/* --- Hint --- */
		--ml-input-hint-color: var(--ml-color-text-muted);
		--ml-input-hint-font-size: var(--ml-text-sm);

		/* --- Prefix / Suffix --- */
		--ml-input-addon-color: var(--ml-color-text-muted);

		/* --- Transition --- */
		--ml-input-transition-duration: var(--ml-duration-150);
		--ml-input-transition-easing: var(--ml-ease-in-out);
	}

	.ml-input {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-input__label {
		font-size: var(--ml-input-label-font-size);
		font-weight: var(--ml-input-label-font-weight);
		color: var(--ml-input-label-color);
		line-height: var(--ml-input-label-line-height);
	}

	.ml-input__required {
		color: var(--ml-input-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-input__wrapper {
		display: flex;
		align-items: center;
		gap: var(--ml-input-gap);
		padding: var(--ml-input-padding);
		background-color: var(--ml-input-bg);
		border: var(--ml-input-border-width) solid var(--ml-input-border-color);
		border-radius: var(--ml-input-border-radius);
		box-shadow: var(--ml-input-shadow);
		transition:
			border-color var(--ml-input-transition-duration) var(--ml-input-transition-easing),
			box-shadow var(--ml-input-transition-duration) var(--ml-input-transition-easing);
	}

	.ml-input__wrapper:hover:not(.ml-input--disabled .ml-input__wrapper) {
		border-color: var(--ml-input-hover-border-color);
	}

	.ml-input__field {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		color: var(--ml-input-color);
		font-family: var(--ml-input-font-family);
		font-size: var(--ml-input-font-size);
		line-height: var(--ml-input-line-height);
	}

	.ml-input__field:focus {
		outline: none;
	}

	.ml-input__field::placeholder {
		color: var(--ml-input-placeholder-color);
	}

	.ml-input__field:disabled {
		cursor: not-allowed;
		color: var(--ml-input-disabled-color);
	}

	.ml-input__hint,
	.ml-input__error {
		font-size: var(--ml-input-hint-font-size);
		line-height: var(--ml-input-label-line-height);
	}

	.ml-input__hint {
		color: var(--ml-input-hint-color);
	}

	.ml-input__error {
		color: var(--ml-input-error-color);
	}

	.ml-input--focused .ml-input__wrapper {
		border-color: var(--ml-input-focus-border-color);
		box-shadow: var(--ml-input-focus-shadow), var(--ml-input-focus-inset-shadow);
	}

	.ml-input--error .ml-input__wrapper {
		border-color: var(--ml-input-error-border-color);
	}

	.ml-input--error.ml-input--focused .ml-input__wrapper {
		box-shadow: var(--ml-input-error-focus-shadow);
	}

	.ml-input--disabled .ml-input__wrapper {
		background-color: var(--ml-input-disabled-bg);
		cursor: not-allowed;
	}

	/* --- Size variants --- */
	.ml-input--sm .ml-input__wrapper {
		padding: var(--ml-space-2) var(--ml-space-3);
	}

	.ml-input--sm .ml-input__field {
		font-size: var(--ml-text-sm);
	}

	.ml-input--md .ml-input__wrapper {
		padding: var(--ml-space-2-5) var(--ml-space-3-5);
	}

	.ml-input--md .ml-input__field {
		font-size: var(--ml-text-sm);
	}

	.ml-input--lg .ml-input__wrapper {
		padding: var(--ml-space-3) var(--ml-space-3-5);
	}

	.ml-input--lg .ml-input__field {
		font-size: var(--ml-text-base);
	}

	::slotted([slot='prefix']),
	::slotted([slot='suffix']) {
		display: flex;
		align-items: center;
		color: var(--ml-input-addon-color);
		flex-shrink: 0;
	}
`;
