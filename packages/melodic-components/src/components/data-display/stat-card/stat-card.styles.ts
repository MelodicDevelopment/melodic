import { css } from '@melodicdev/core';

export const statCardStyles = () => css`
	:host {
		display: block;
		min-width: var(--ml-stat-card-min-width, 200px);
	}

	.ml-stat-card {
		background-color: var(--ml-stat-card-bg, var(--ml-color-surface));
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		padding: var(--ml-space-5) var(--ml-space-6);
		box-shadow: var(--ml-shadow-xs);
	}

	.ml-stat-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-3);
		margin-bottom: var(--ml-space-2);
	}

	.ml-stat-card__label {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ml-stat-card__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-stat-card-icon-size, 36px);
		height: var(--ml-stat-card-icon-size, 36px);
		border-radius: var(--ml-radius);
		background-color: var(--ml-stat-card-icon-bg, var(--ml-color-surface-raised, var(--ml-color-surface-sunken)));
		color: var(--ml-stat-card-icon-color, var(--ml-color-text-tertiary));
		flex-shrink: 0;
	}

	.ml-stat-card__value {
		color: var(--ml-stat-card-value-color, var(--ml-color-text));
		line-height: 1.1;
		margin-bottom: var(--ml-space-1);
	}

	.ml-stat-card__value--serif {
		font-family: var(--ml-stat-card-value-font, 'Cormorant Garamond', 'Georgia', serif);
		font-size: var(--ml-stat-card-value-size, 2.5rem);
		font-weight: var(--ml-stat-card-value-weight, 300);
	}

	.ml-stat-card__value--sans {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-stat-card-value-size, 2rem);
		font-weight: var(--ml-font-bold);
	}

	.ml-stat-card__trend {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-normal);
	}

	.ml-stat-card__trend--up {
		color: var(--ml-color-success);
	}

	.ml-stat-card__trend--down {
		color: var(--ml-color-error);
	}

	.ml-stat-card__trend--neutral {
		color: var(--ml-color-text-muted);
	}
`;
