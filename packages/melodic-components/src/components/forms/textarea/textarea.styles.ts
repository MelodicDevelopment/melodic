import { css } from '@melodicdev/core';

export const textareaStyles = () => css`
	:host {
		display: block;
		width: 100%;
		min-width: 0;

		/* --- Label --- */
		--ml-textarea-label-font-size: var(--ml-text-sm);
		--ml-textarea-label-font-weight: var(--ml-font-medium);
		--ml-textarea-label-color: var(--ml-color-text-secondary);
		--ml-textarea-label-line-height: var(--ml-leading-tight);

		/* --- Required indicator --- */
		--ml-textarea-required-color: var(--ml-color-danger);

		/* --- Field --- */
		--ml-textarea-bg: var(--ml-color-input-bg);
		--ml-textarea-border-width: var(--ml-border);
		--ml-textarea-border-color: var(--ml-color-border-strong);
		--ml-textarea-border-radius: var(--ml-radius);
		--ml-textarea-shadow: var(--ml-shadow-xs);
		--ml-textarea-color: var(--ml-color-text);
		--ml-textarea-font-family: var(--ml-font-sans);
		--ml-textarea-font-size: var(--ml-text-sm);
		--ml-textarea-line-height: var(--ml-leading-normal);
		--ml-textarea-padding: var(--ml-space-3) var(--ml-space-3-5);
		--ml-textarea-min-height: 80px;
		--ml-textarea-placeholder-color: var(--ml-color-text-muted);
		--ml-textarea-hover-border-color: var(--ml-color-border);

		/* --- Focus --- */
		--ml-textarea-focus-border-color: var(--ml-color-primary);
		--ml-textarea-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Error --- */
		--ml-textarea-error-border-color: var(--ml-color-danger);
		--ml-textarea-error-focus-shadow: var(--ml-shadow-ring-error);
		--ml-textarea-error-color: var(--ml-color-danger);

		/* --- Disabled --- */
		--ml-textarea-disabled-bg: var(--ml-color-input-disabled-bg);
		--ml-textarea-disabled-color: var(--ml-color-text-muted);

		/* --- Hint / Counter --- */
		--ml-textarea-hint-color: var(--ml-color-text-muted);
		--ml-textarea-hint-font-size: var(--ml-text-sm);
		--ml-textarea-counter-font-size: var(--ml-text-xs);
		--ml-textarea-counter-color: var(--ml-color-text-muted);

		/* --- Transition --- */
		--ml-textarea-transition-duration: var(--ml-duration-150);
		--ml-textarea-transition-easing: var(--ml-ease-in-out);
	}

	.ml-textarea {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-textarea__label {
		font-size: var(--ml-textarea-label-font-size);
		font-weight: var(--ml-textarea-label-font-weight);
		color: var(--ml-textarea-label-color);
		line-height: var(--ml-textarea-label-line-height);
	}

	.ml-textarea__required {
		color: var(--ml-textarea-required-color);
		margin-left: var(--ml-space-0-5);
	}

	.ml-textarea__field {
		box-sizing: border-box;
		width: 100%;
		min-height: var(--ml-textarea-min-height);
		padding: var(--ml-textarea-padding);
		background-color: var(--ml-textarea-bg);
		border: var(--ml-textarea-border-width) solid var(--ml-textarea-border-color);
		border-radius: var(--ml-textarea-border-radius);
		box-shadow: var(--ml-textarea-shadow);
		color: var(--ml-textarea-color);
		font-family: var(--ml-textarea-font-family);
		font-size: var(--ml-textarea-font-size);
		line-height: var(--ml-textarea-line-height);
		resize: none;
		transition:
			border-color var(--ml-textarea-transition-duration) var(--ml-textarea-transition-easing),
			box-shadow var(--ml-textarea-transition-duration) var(--ml-textarea-transition-easing);
	}

	.ml-textarea__field:hover:not(:disabled) {
		border-color: var(--ml-textarea-hover-border-color);
	}

	.ml-textarea__field:focus {
		outline: none;
		border-color: var(--ml-textarea-focus-border-color);
		box-shadow: var(--ml-textarea-focus-shadow);
	}

	.ml-textarea__field::placeholder {
		color: var(--ml-textarea-placeholder-color);
	}

	.ml-textarea__field:disabled {
		background-color: var(--ml-textarea-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-textarea-disabled-color);
	}

	.ml-textarea__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 1.25rem;
	}

	.ml-textarea__error,
	.ml-textarea__hint {
		font-size: var(--ml-textarea-hint-font-size);
		line-height: var(--ml-textarea-label-line-height);
	}

	.ml-textarea__error {
		color: var(--ml-textarea-error-color);
	}

	.ml-textarea__hint {
		color: var(--ml-textarea-hint-color);
	}

	.ml-textarea__counter {
		font-size: var(--ml-textarea-counter-font-size);
		color: var(--ml-textarea-counter-color);
		margin-left: auto;
	}

	.ml-textarea--resize .ml-textarea__field {
		resize: vertical;
	}

	.ml-textarea--error .ml-textarea__field {
		border-color: var(--ml-textarea-error-border-color);
	}

	.ml-textarea--error .ml-textarea__field:focus {
		box-shadow: var(--ml-textarea-error-focus-shadow);
	}

	/* --- Size variants --- */
	.ml-textarea--sm .ml-textarea__field {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-textarea--lg .ml-textarea__field {
		padding: var(--ml-space-3-5) var(--ml-space-4);
		font-size: var(--ml-text-base);
	}
`;
