import { css } from '@melodicdev/core';

export const radioStyles = () => css`
	:host {
		display: block;
	}

	.ml-radio {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-space-2);
		cursor: pointer;
		user-select: none;
	}

	.ml-radio--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Hidden native radio */
	.ml-radio__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* Custom radio circle */
	.ml-radio__circle {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--ml-color-surface);
		border: var(--ml-border-2) solid var(--ml-color-border-strong);
		border-radius: var(--ml-radius-full);
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-radio__input:focus-visible + .ml-radio__circle {
		outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
		outline-offset: var(--ml-focus-ring-offset);
	}

	.ml-radio--checked .ml-radio__circle {
		border-color: var(--ml-color-primary);
	}

	.ml-radio:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-color-primary);
	}

	/* Inner dot */
	.ml-radio__dot {
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-color-primary);
		transform: scale(0);
		transition: transform var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-radio--checked .ml-radio__dot {
		transform: scale(1);
	}

	/* Sizes */
	.ml-radio--sm .ml-radio__circle {
		width: 1rem;
		height: 1rem;
	}

	.ml-radio--sm .ml-radio__dot {
		width: 0.375rem;
		height: 0.375rem;
	}

	.ml-radio--md .ml-radio__circle {
		width: 1.25rem;
		height: 1.25rem;
	}

	.ml-radio--md .ml-radio__dot {
		width: 0.5rem;
		height: 0.5rem;
	}

	.ml-radio--lg .ml-radio__circle {
		width: 1.5rem;
		height: 1.5rem;
	}

	.ml-radio--lg .ml-radio__dot {
		width: 0.625rem;
		height: 0.625rem;
	}

	/* Label */
	.ml-radio__label {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text);
		line-height: 1.25rem;
	}

	.ml-radio--lg .ml-radio__label {
		font-size: var(--ml-text-base);
		line-height: 1.5rem;
	}

	/* Hint */
	.ml-radio__hint {
		display: block;
		margin-top: var(--ml-space-1);
		margin-left: calc(1.25rem + var(--ml-space-2));
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
	}
`;
