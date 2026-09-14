import { css } from '@melodicdev/core';

export const statCardStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Stat Card: surface
	 * --ml-stat-card-bg: var(--ml-color-surface)
	 * --ml-stat-card-border-width: var(--ml-border)
	 * --ml-stat-card-border-color: var(--ml-color-border)
	 * --ml-stat-card-radius: var(--ml-radius-lg)
	 * --ml-stat-card-padding: var(--ml-space-5) var(--ml-space-6)
	 * --ml-stat-card-shadow: var(--ml-shadow-xs)
	 *
	 * Stat Card: label
	 * --ml-stat-card-label-font: var(--ml-font-sans)
	 * --ml-stat-card-label-size: var(--ml-text-xs)
	 * --ml-stat-card-label-weight: var(--ml-font-semibold)
	 * --ml-stat-card-label-color: var(--ml-color-text-muted)
	 *
	 * Stat Card: icon
	 * --ml-stat-card-icon-size: 36px
	 * --ml-stat-card-icon-bg: var(--ml-color-surface-raised, var(--ml-color-surface-sunken))
	 * --ml-stat-card-icon-color: var(--ml-color-text-tertiary)
	 * --ml-stat-card-icon-radius: var(--ml-radius)
	 *
	 * Stat Card: value
	 * --ml-stat-card-value-color: var(--ml-color-text)
	 * --ml-stat-card-value-font: 'Cormorant Garamond', 'Georgia', serif
	 * --ml-stat-card-value-size: 2.5rem
	 * --ml-stat-card-value-weight: 300
	 * --ml-stat-card-value-sans-size: 2rem
	 *
	 * Stat Card: trend
	 * --ml-stat-card-trend-font: var(--ml-font-sans)
	 * --ml-stat-card-trend-size: var(--ml-text-xs)
	 * --ml-stat-card-trend-color: var(--ml-color-text-muted)
	 * --ml-stat-card-trend-up-color: var(--ml-color-success)
	 * --ml-stat-card-trend-down-color: var(--ml-color-error)
	 *
	 * --ml-stat-card-min-width: 200px
	 */

	:host {
		display: block;

		min-width: var(--ml-stat-card-min-width, 200px);
	}

	.ml-stat-card {
		background-color: var(--ml-stat-card-bg, var(--ml-color-surface));
		border: var(--ml-stat-card-border-width, var(--ml-border)) solid var(--ml-stat-card-border-color, var(--ml-color-border));
		border-radius: var(--ml-stat-card-radius, var(--ml-radius-lg));
		padding: var(--ml-stat-card-padding, var(--ml-space-5) var(--ml-space-6));
		box-shadow: var(--ml-stat-card-shadow, var(--ml-shadow-xs));
	}

	.ml-stat-card__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-3);
		margin-bottom: var(--ml-space-2);
	}

	.ml-stat-card__label {
		font-family: var(--ml-stat-card-label-font, var(--ml-font-sans));
		font-size: var(--ml-stat-card-label-size, var(--ml-text-xs));
		font-weight: var(--ml-stat-card-label-weight, var(--ml-font-semibold));
		color: var(--ml-stat-card-label-color, var(--ml-color-text-muted));
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ml-stat-card__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-stat-card-icon-size, 36px);
		height: var(--ml-stat-card-icon-size, 36px);
		border-radius: var(--ml-stat-card-icon-radius, var(--ml-radius));
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
		font-size: var(--ml-stat-card-value-sans-size, 2rem);
		font-weight: var(--ml-font-bold);
	}

	.ml-stat-card__trend {
		font-family: var(--ml-stat-card-trend-font, var(--ml-font-sans));
		font-size: var(--ml-stat-card-trend-size, var(--ml-text-xs));
		color: var(--ml-stat-card-trend-color, var(--ml-color-text-muted));
		line-height: var(--ml-leading-normal);
	}

	.ml-stat-card__trend--up {
		color: var(--ml-stat-card-trend-up-color, var(--ml-color-success));
	}

	.ml-stat-card__trend--down {
		color: var(--ml-stat-card-trend-down-color, var(--ml-color-error));
	}

	.ml-stat-card__trend--neutral {
		color: var(--ml-stat-card-trend-color, var(--ml-color-text-muted));
	}
`;
