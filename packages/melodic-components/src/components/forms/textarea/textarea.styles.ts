import { css } from '@melodicdev/core';

export const textareaStyles = () => css`
	:host {
		display: block;
		width: 100%;
	}

	.ml-textarea {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	/* Label */
	.ml-textarea__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
	}

	.ml-textarea__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0.5);
	}

	/* Field */
	.ml-textarea__field {
		width: 100%;
		min-height: 80px;
		padding: var(--ml-space-2) var(--ml-space-3);
		background-color: var(--ml-color-surface);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		color: var(--ml-color-text);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-normal);
		resize: none;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-textarea--resize .ml-textarea__field {
		resize: vertical;
	}

	.ml-textarea__field:focus {
		outline: none;
		border-color: var(--ml-color-focus-ring);
		box-shadow: 0 0 0 3px var(--ml-color-primary-subtle);
	}

	.ml-textarea__field::placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-textarea__field:disabled {
		background-color: var(--ml-color-surface-sunken);
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Error state */
	.ml-textarea--error .ml-textarea__field {
		border-color: var(--ml-color-danger);
	}

	.ml-textarea--error .ml-textarea__field:focus {
		box-shadow: 0 0 0 3px var(--ml-color-danger-subtle);
	}

	/* Sizes */
	.ml-textarea--sm .ml-textarea__field {
		padding: var(--ml-space-1.5) var(--ml-space-2.5);
		font-size: var(--ml-text-sm);
	}

	.ml-textarea--lg .ml-textarea__field {
		padding: var(--ml-space-3) var(--ml-space-4);
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
