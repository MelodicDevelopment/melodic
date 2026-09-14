import { css } from '@melodicdev/core';

export const radioCardStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Card
	 * --ml-radio-card-padding: var(--ml-space-4)
	 * --ml-radio-card-border-width: var(--ml-border)
	 * --ml-radio-card-border-color: var(--ml-color-border)
	 * --ml-radio-card-border-radius: var(--ml-radius-lg)
	 * --ml-radio-card-bg: var(--ml-color-surface)
	 * --ml-radio-card-gap: var(--ml-space-3)
	 *
	 * Hover
	 * --ml-radio-card-hover-border-color: var(--ml-color-border-strong)
	 * --ml-radio-card-hover-bg: var(--ml-color-surface-raised)
	 *
	 * Selected
	 * --ml-radio-card-selected-border-color: var(--ml-color-primary)
	 * --ml-radio-card-selected-bg: var(--ml-color-primary-subtle)
	 * --ml-radio-card-selected-ring: 0 0 0 1px var(--ml-color-primary)
	 * --ml-radio-card-selected-hover-border-color: var(--ml-color-primary-hover)
	 * --ml-radio-card-selected-hover-ring: 0 0 0 1px var(--ml-color-primary-hover)
	 *
	 * Focus
	 * --ml-radio-card-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Circle
	 * --ml-radio-card-circle-size: 1.25rem
	 * --ml-radio-card-circle-border-width: var(--ml-border)
	 * --ml-radio-card-circle-border-color: var(--ml-color-border-strong)
	 * --ml-radio-card-circle-bg: var(--ml-color-input-bg)
	 * --ml-radio-card-circle-border-radius: var(--ml-radius-full)
	 *
	 * Dot
	 * --ml-radio-card-dot-size: 0.5rem
	 * --ml-radio-card-dot-color: var(--ml-color-primary)
	 *
	 * Icon
	 * --ml-radio-card-icon-color: var(--ml-color-text-muted)
	 * --ml-radio-card-icon-selected-color: var(--ml-color-primary)
	 *
	 * Label
	 * --ml-radio-card-label-font-size: var(--ml-text-sm)
	 * --ml-radio-card-label-font-weight: var(--ml-font-medium)
	 * --ml-radio-card-label-color: var(--ml-color-text)
	 * --ml-radio-card-label-line-height: var(--ml-leading-tight)
	 *
	 * Description
	 * --ml-radio-card-description-font-size: var(--ml-text-sm)
	 * --ml-radio-card-description-color: var(--ml-color-text-muted)
	 * --ml-radio-card-description-line-height: var(--ml-leading-normal)
	 *
	 * Detail
	 * --ml-radio-card-detail-font-size: var(--ml-text-sm)
	 * --ml-radio-card-detail-font-weight: var(--ml-font-medium)
	 * --ml-radio-card-detail-color: var(--ml-color-text)
	 * --ml-radio-card-detail-line-height: var(--ml-leading-tight)
	 *
	 * Disabled
	 * --ml-radio-card-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-radio-card-transition-duration: var(--ml-duration-150)
	 * --ml-radio-card-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-radio-card {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-radio-card-gap, var(--ml-space-3));
		padding: var(--ml-radio-card-padding, var(--ml-space-4));
		border: var(--ml-radio-card-border-width, var(--ml-border)) solid var(--ml-radio-card-border-color, var(--ml-color-border));
		border-radius: var(--ml-radio-card-border-radius, var(--ml-radius-lg));
		background-color: var(--ml-radio-card-bg, var(--ml-color-surface));
		cursor: pointer;
		transition:
			border-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio-card:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-radio-card-hover-border-color, var(--ml-color-border-strong));
		background-color: var(--ml-radio-card-hover-bg, var(--ml-color-surface-raised));
	}

	.ml-radio-card--selected {
		border-color: var(--ml-radio-card-selected-border-color, var(--ml-color-primary));
		background-color: var(--ml-radio-card-selected-bg, var(--ml-color-primary-subtle));
		box-shadow: var(--ml-radio-card-selected-ring, 0 0 0 1px var(--ml-color-primary));
	}

	.ml-radio-card--selected:hover:not(.ml-radio-card--disabled) {
		border-color: var(--ml-radio-card-selected-hover-border-color, var(--ml-color-primary-hover));
		background-color: var(--ml-radio-card-selected-bg, var(--ml-color-primary-subtle));
		box-shadow: var(--ml-radio-card-selected-hover-ring, 0 0 0 1px var(--ml-color-primary-hover));
	}

	.ml-radio-card:focus-visible {
		outline: none;
		box-shadow: var(--ml-radio-card-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-radio-card--selected:focus-visible {
		box-shadow: var(--ml-radio-card-selected-ring, 0 0 0 1px var(--ml-color-primary)), var(--ml-radio-card-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-radio-card--disabled {
		opacity: var(--ml-radio-card-disabled-opacity, 0.5);
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
		width: var(--ml-radio-card-circle-size, 1.25rem);
		height: var(--ml-radio-card-circle-size, 1.25rem);
		border: var(--ml-radio-card-circle-border-width, var(--ml-border)) solid var(--ml-radio-card-circle-border-color, var(--ml-color-border-strong));
		border-radius: var(--ml-radio-card-circle-border-radius, var(--ml-radius-full));
		background-color: var(--ml-radio-card-circle-bg, var(--ml-color-input-bg));
		transition:
			border-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio-card--selected .ml-radio-card__circle {
		border-color: var(--ml-radio-card-selected-border-color, var(--ml-color-primary));
		background-color: var(--ml-radio-card-selected-bg, var(--ml-color-primary-subtle));
	}

	.ml-radio-card__dot {
		width: var(--ml-radio-card-dot-size, 0.5rem);
		height: var(--ml-radio-card-dot-size, 0.5rem);
		border-radius: var(--ml-radio-card-circle-border-radius, var(--ml-radius-full));
		background-color: var(--ml-radio-card-dot-color, var(--ml-color-primary));
		transform: scale(0);
		transition: transform var(--ml-radio-card-transition-duration, var(--ml-duration-150)) var(--ml-radio-card-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio-card--selected .ml-radio-card__dot {
		transform: scale(1);
	}

	/* Content area */
	.ml-radio-card__content {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-radio-card-gap, var(--ml-space-3));
		flex: 1;
		min-width: 0;
	}

	.ml-radio-card__icon {
		flex-shrink: 0;
		color: var(--ml-radio-card-icon-color, var(--ml-color-text-muted));
	}

	.ml-radio-card--selected .ml-radio-card__icon {
		color: var(--ml-radio-card-icon-selected-color, var(--ml-color-primary));
	}

	.ml-radio-card__text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
		min-width: 0;
	}

	.ml-radio-card__label {
		font-size: var(--ml-radio-card-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-radio-card-label-font-weight, var(--ml-font-medium));
		color: var(--ml-radio-card-label-color, var(--ml-color-text));
		line-height: var(--ml-radio-card-label-line-height, var(--ml-leading-tight));
	}

	.ml-radio-card__description {
		font-size: var(--ml-radio-card-description-font-size, var(--ml-text-sm));
		color: var(--ml-radio-card-description-color, var(--ml-color-text-muted));
		line-height: var(--ml-radio-card-description-line-height, var(--ml-leading-normal));
	}

	/* Detail (e.g. price) */
	.ml-radio-card__detail {
		flex-shrink: 0;
		font-size: var(--ml-radio-card-detail-font-size, var(--ml-text-sm));
		font-weight: var(--ml-radio-card-detail-font-weight, var(--ml-font-medium));
		color: var(--ml-radio-card-detail-color, var(--ml-color-text));
		line-height: var(--ml-radio-card-detail-line-height, var(--ml-leading-tight));
		padding-top: var(--ml-space-0-5);
	}
`;
