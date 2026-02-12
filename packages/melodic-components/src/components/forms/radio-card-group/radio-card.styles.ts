import { css } from '@melodicdev/core';

export const radioCardStyles = () => css`
	:host {
		display: block;
	}

	.ml-radio-card {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		background-color: var(--ml-color-surface);
		cursor: pointer;
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-radio-card:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-color-border-strong);
		background-color: var(--ml-color-surface-raised);
	}

	.ml-radio-card--selected {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-primary-subtle);
		box-shadow: 0 0 0 1px var(--ml-color-primary);
	}

	.ml-radio-card--selected:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-color-primary-hover);
		background-color: var(--ml-color-primary-subtle);
		box-shadow: 0 0 0 1px var(--ml-color-primary-hover);
	}

	.ml-radio-card:focus-visible {
		outline: none;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-radio-card--selected:focus-visible {
		box-shadow: 0 0 0 1px var(--ml-color-primary), var(--ml-shadow-focus-ring);
	}

	.ml-radio-card--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Radio indicator */
	.ml-radio-card__radio {
		flex-shrink: 0;
		padding-top: var(--ml-space-0-5);
	}

	.ml-radio-card__circle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border: var(--ml-border) solid var(--ml-color-border-strong);
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-color-input-bg);
		transition:
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-radio-card--selected .ml-radio-card__circle {
		border-color: var(--ml-color-primary);
		background-color: var(--ml-color-primary-subtle);
	}

	.ml-radio-card__dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--ml-radius-full);
		background-color: var(--ml-color-primary);
		transform: scale(0);
		transition: transform var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-radio-card--selected .ml-radio-card__dot {
		transform: scale(1);
	}

	/* Content area */
	.ml-radio-card__content {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-space-3);
		flex: 1;
		min-width: 0;
	}

	.ml-radio-card__icon {
		flex-shrink: 0;
		color: var(--ml-color-text-muted);
	}

	.ml-radio-card--selected .ml-radio-card__icon {
		color: var(--ml-color-primary);
	}

	.ml-radio-card__text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
		min-width: 0;
	}

	.ml-radio-card__label {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-radio-card__description {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-normal);
	}

	/* Detail (e.g. price) */
	.ml-radio-card__detail {
		flex-shrink: 0;
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
		padding-top: var(--ml-space-0-5);
	}
`;
