import { css } from '@melodicdev/core';

export const textareaStyles = () => css`
	:host {
		display: block;
		width: 100%;
	}

	.ml-textarea {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	/* Label */
	.ml-textarea__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-tight);
	}

	.ml-textarea__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0-5);
	}

	/* Field */
	.ml-textarea__field {
		width: 100%;
		min-height: 80px;
		padding: var(--ml-space-3) var(--ml-space-3-5);
		background-color: var(--ml-color-input-bg);
		border: var(--ml-border) solid var(--ml-color-border-strong);
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-xs);
		color: var(--ml-color-text);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-normal);
		resize: none;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-textarea__field:hover:not(:disabled) {
		border-color: var(--ml-color-border);
	}

	.ml-textarea--resize .ml-textarea__field {
		resize: vertical;
	}

	.ml-textarea__field:focus {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-textarea__field::placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-textarea__field:disabled {
		background-color: var(--ml-color-input-disabled-bg);
		cursor: not-allowed;
		color: var(--ml-color-text-muted);
	}

	/* Error state */
	.ml-textarea--error .ml-textarea__field {
		border-color: var(--ml-color-danger);
	}

	.ml-textarea--error .ml-textarea__field:focus {
		box-shadow: var(--ml-shadow-ring-error);
	}

	/* Sizes */
	.ml-textarea--sm .ml-textarea__field {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	.ml-textarea--lg .ml-textarea__field {
		padding: var(--ml-space-3-5) var(--ml-space-4);
		font-size: var(--ml-text-base);
	}

	/* Footer */
	.ml-textarea__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 1.25rem;
	}

	/* Error/Hint */
	.ml-textarea__error,
	.ml-textarea__hint {
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-tight);
	}

	.ml-textarea__error {
		color: var(--ml-color-danger);
	}

	.ml-textarea__hint {
		color: var(--ml-color-text-muted);
	}

	/* Counter */
	.ml-textarea__counter {
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-muted);
		margin-left: auto;
	}
`;
