import { css } from '@melodicdev/core';

export const radioGroupStyles = () => css`
	:host {
		display: block;
	}

	.ml-radio-group {
		border: none;
		padding: 0;
		margin: 0;
	}

	.ml-radio-group__legend {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		margin-bottom: var(--ml-space-2);
	}

	.ml-radio-group__required {
		color: var(--ml-color-danger);
		margin-left: var(--ml-space-0.5);
	}

	/* Options container */
	.ml-radio-group__options {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-2);
	}

	.ml-radio-group--horizontal .ml-radio-group__options {
		flex-direction: row;
		flex-wrap: wrap;
		gap: var(--ml-space-4);
	}

	/* Disabled state */
	.ml-radio-group--disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	/* Hint & Error */
	.ml-radio-group__hint,
	.ml-radio-group__error {
		display: block;
		margin-top: var(--ml-space-2);
		font-size: var(--ml-text-sm);
	}

	.ml-radio-group__hint {
		color: var(--ml-color-text-muted);
	}

	.ml-radio-group__error {
		color: var(--ml-color-danger);
	}
`;
