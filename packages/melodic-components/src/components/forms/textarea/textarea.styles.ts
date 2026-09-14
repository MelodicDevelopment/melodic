import { css } from '@melodicdev/core';

export const textareaStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Label
	 * --ml-textarea-label-font-size: var(--ml-text-sm)
	 * --ml-textarea-label-font-weight: var(--ml-font-medium)
	 * --ml-textarea-label-color: var(--ml-color-text-secondary)
	 * --ml-textarea-label-line-height: var(--ml-leading-tight)
	 *
	 * Required indicator
	 * --ml-textarea-required-color: var(--ml-color-danger)
	 *
	 * Field
	 * --ml-textarea-bg: var(--ml-color-input-bg)
	 * --ml-textarea-border-width: var(--ml-border)
	 * --ml-textarea-border-color: var(--ml-color-border)
	 * --ml-textarea-border-radius: var(--ml-radius)
	 * --ml-textarea-shadow: none
	 * --ml-textarea-color: var(--ml-color-text)
	 * --ml-textarea-font-family: var(--ml-font-sans)
	 * --ml-textarea-font-size: var(--ml-text-sm)
	 * --ml-textarea-line-height: var(--ml-leading-normal)
	 * --ml-textarea-padding: var(--ml-space-3) var(--ml-space-3-5)
	 * --ml-textarea-min-height: 80px
	 * --ml-textarea-placeholder-color: var(--ml-color-text-muted)
	 * --ml-textarea-hover-border-color: var(--ml-color-border)
	 *
	 * Focus
	 * --ml-textarea-focus-border-color: var(--ml-color-primary)
	 * --ml-textarea-focus-shadow: var(--ml-shadow-focus-ring)
	 * --ml-textarea-focus-inset-shadow: none
	 *
	 * Error
	 * --ml-textarea-error-border-color: var(--ml-color-danger)
	 * --ml-textarea-error-focus-shadow: var(--ml-shadow-ring-error)
	 * --ml-textarea-error-color: var(--ml-color-danger)
	 *
	 * Disabled
	 * --ml-textarea-disabled-bg: var(--ml-color-input-disabled-bg)
	 * --ml-textarea-disabled-color: var(--ml-color-text-muted)
	 *
	 * Hint / Counter
	 * --ml-textarea-hint-color: var(--ml-color-text-muted)
	 * --ml-textarea-hint-font-size: var(--ml-text-sm)
	 * --ml-textarea-counter-font-size: var(--ml-text-xs)
	 * --ml-textarea-counter-color: var(--ml-color-text-muted)
	 *
	 * Transition
	 * --ml-textarea-transition-duration: var(--ml-duration-150)
	 * --ml-textarea-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
		width: 100%;
		min-width: 0;
	}

	.ml-textarea {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1-5);
	}

	.ml-textarea__label {
		font-size: var(--ml-textarea-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-textarea-label-font-weight, var(--ml-font-medium));
		color: var(--ml-textarea-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-textarea-label-line-height, var(--ml-leading-tight));
	}

	.ml-textarea__required {
		color: var(--ml-textarea-required-color, var(--ml-color-danger));
		margin-left: var(--ml-space-0-5);
	}

	.ml-textarea__field {
		box-sizing: border-box;
		width: 100%;
		min-height: var(--ml-textarea-min-height, 80px);
		padding: var(--ml-textarea-padding, var(--ml-space-3) var(--ml-space-3-5));
		background-color: var(--ml-textarea-bg, var(--ml-color-input-bg));
		border: var(--ml-textarea-border-width, var(--ml-border)) solid var(--ml-textarea-border-color, var(--ml-color-border));
		border-radius: var(--ml-textarea-border-radius, var(--ml-radius));
		box-shadow: var(--ml-textarea-shadow, none);
		color: var(--ml-textarea-color, var(--ml-color-text));
		font-family: var(--ml-textarea-font-family, var(--ml-font-sans));
		font-size: var(--ml-textarea-font-size, var(--ml-text-sm));
		line-height: var(--ml-textarea-line-height, var(--ml-leading-normal));
		resize: none;
		transition:
			border-color var(--ml-textarea-transition-duration, var(--ml-duration-150)) var(--ml-textarea-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-textarea-transition-duration, var(--ml-duration-150)) var(--ml-textarea-transition-easing, var(--ml-ease-in-out));
	}

	.ml-textarea__field:hover:not(:disabled) {
		border-color: var(--ml-textarea-hover-border-color, var(--ml-color-border));
	}

	.ml-textarea__field:focus {
		outline: none;
		border-color: var(--ml-textarea-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-textarea-focus-shadow, var(--ml-shadow-focus-ring)), var(--ml-textarea-focus-inset-shadow, none);
	}

	.ml-textarea__field::placeholder {
		color: var(--ml-textarea-placeholder-color, var(--ml-color-text-muted));
	}

	.ml-textarea__field:disabled {
		background-color: var(--ml-textarea-disabled-bg, var(--ml-color-input-disabled-bg));
		cursor: not-allowed;
		color: var(--ml-textarea-disabled-color, var(--ml-color-text-muted));
	}

	.ml-textarea__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 1.25rem;
	}

	.ml-textarea__error,
	.ml-textarea__hint {
		font-size: var(--ml-textarea-hint-font-size, var(--ml-text-sm));
		line-height: var(--ml-textarea-label-line-height, var(--ml-leading-tight));
	}

	.ml-textarea__error {
		color: var(--ml-textarea-error-color, var(--ml-color-danger));
	}

	.ml-textarea__hint {
		color: var(--ml-textarea-hint-color, var(--ml-color-text-muted));
	}

	.ml-textarea__counter {
		font-size: var(--ml-textarea-counter-font-size, var(--ml-text-xs));
		color: var(--ml-textarea-counter-color, var(--ml-color-text-muted));
		margin-left: auto;
	}

	.ml-textarea--resize .ml-textarea__field {
		resize: vertical;
	}

	.ml-textarea--error .ml-textarea__field {
		border-color: var(--ml-textarea-error-border-color, var(--ml-color-danger));
	}

	.ml-textarea--error .ml-textarea__field:focus {
		box-shadow: var(--ml-textarea-error-focus-shadow, var(--ml-shadow-ring-error));
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
