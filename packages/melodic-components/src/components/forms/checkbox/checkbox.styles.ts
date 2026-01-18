import { css } from '@melodicdev/core';

export const checkboxStyles = () => css`
	:host {
		display: block;
	}

	.ml-checkbox {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-space-3);
		cursor: pointer;
		user-select: none;
	}

	.ml-checkbox:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		border-color: var(--ml-color-primary);
	}

	.ml-checkbox__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-checkbox__input:focus-visible + .ml-checkbox__box {
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-checkbox__box {
		position: relative;
		flex-shrink: 0;
		display: block;
		background-color: var(--ml-color-input-bg);
		border: var(--ml-border) solid var(--ml-color-border-strong);
		border-radius: var(--ml-radius-xs);
		color: var(--ml-color-text-inverse);
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-checkbox__check,
	.ml-checkbox__minus {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 75%;
		height: 75%;
	}

	.ml-checkbox__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		line-height: 1.25rem;
	}

	.ml-checkbox__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(1.25rem + var(--ml-space-3));
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-tight);
	}

	.ml-checkbox--disabled {
		cursor: not-allowed;
	}

	.ml-checkbox--disabled .ml-checkbox__box,
	.ml-checkbox--disabled .ml-checkbox__label {
		opacity: 0.5;
	}

	.ml-checkbox--checked .ml-checkbox__box,
	.ml-checkbox--indeterminate .ml-checkbox__box {
		background-color: var(--ml-color-primary);
		border-color: var(--ml-color-primary);
	}

	.ml-checkbox--checked:hover:not(.ml-checkbox--disabled) .ml-checkbox__box,
	.ml-checkbox--indeterminate:hover:not(.ml-checkbox--disabled) .ml-checkbox__box {
		background-color: var(--ml-color-primary-hover);
		border-color: var(--ml-color-primary-hover);
	}

	.ml-checkbox--sm .ml-checkbox__box {
		width: 1rem;
		height: 1rem;
	}

	.ml-checkbox--md .ml-checkbox__box {
		width: 1.25rem;
		height: 1.25rem;
	}

	.ml-checkbox--lg .ml-checkbox__box {
		width: 1.5rem;
		height: 1.5rem;
	}

	.ml-checkbox--lg .ml-checkbox__label {
		font-size: var(--ml-text-base);
		line-height: 1.5rem;
	}

	.ml-checkbox--lg + .ml-checkbox__hint {
		margin-left: calc(1.5rem + var(--ml-space-3));
	}
`;
