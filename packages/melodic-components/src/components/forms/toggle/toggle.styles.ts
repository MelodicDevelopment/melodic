import { css } from '@melodicdev/core';

export const toggleStyles = () => css`
	:host {
		display: block;
	}

	.ml-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-3);
		cursor: pointer;
		user-select: none;
	}

	.ml-toggle--disabled {
		cursor: not-allowed;
	}

	.ml-toggle--disabled .ml-toggle__track,
	.ml-toggle--disabled .ml-toggle__label {
		opacity: 0.5;
	}

	/* Hidden native checkbox */
	.ml-toggle__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* Track */
	.ml-toggle__track {
		position: relative;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		background-color: var(--ml-color-toggle-off);
		border-radius: var(--ml-radius-full);
		transition:
			background-color var(--ml-duration-200) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-200) var(--ml-ease-in-out);
	}

	.ml-toggle__input:focus-visible + .ml-toggle__track {
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-toggle--checked .ml-toggle__track {
		background-color: var(--ml-color-primary);
	}

	.ml-toggle:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-color-toggle-off-hover);
	}

	.ml-toggle--checked:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-color-primary-hover);
	}

	/* Thumb */
	.ml-toggle__thumb {
		position: absolute;
		background-color: var(--ml-white);
		border-radius: var(--ml-radius-full);
		box-shadow: var(--ml-shadow-sm);
		transition: transform var(--ml-duration-200) var(--ml-ease-in-out);
	}

	/* Sizes */
	.ml-toggle--sm .ml-toggle__track {
		width: 2.25rem;
		height: 1.25rem;
	}

	.ml-toggle--sm .ml-toggle__thumb {
		width: 1rem;
		height: 1rem;
		left: 0.125rem;
	}

	.ml-toggle--sm.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(1rem);
	}

	.ml-toggle--md .ml-toggle__track {
		width: 2.75rem;
		height: 1.5rem;
	}

	.ml-toggle--md .ml-toggle__thumb {
		width: 1.25rem;
		height: 1.25rem;
		left: 0.125rem;
	}

	.ml-toggle--md.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(1.25rem);
	}

	.ml-toggle--lg .ml-toggle__track {
		width: 3rem;
		height: 1.75rem;
	}

	.ml-toggle--lg .ml-toggle__thumb {
		width: 1.5rem;
		height: 1.5rem;
		left: 0.125rem;
	}

	.ml-toggle--lg.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(1.25rem);
	}

	/* Label */
	.ml-toggle__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
	}

	.ml-toggle--lg .ml-toggle__label {
		font-size: var(--ml-text-base);
	}

	/* Hint */
	.ml-toggle__hint {
		display: block;
		margin-top: var(--ml-space-1);
		margin-left: calc(2.75rem + var(--ml-space-3));
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-tight);
	}
`;
