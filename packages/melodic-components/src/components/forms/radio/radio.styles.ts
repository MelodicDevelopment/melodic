import { css } from '@melodicdev/core';

export const radioStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Circle
	 * --ml-radio-circle-size: 1.25rem
	 * --ml-radio-circle-bg: var(--ml-color-input-bg)
	 * --ml-radio-circle-border-width: var(--ml-border)
	 * --ml-radio-circle-border-color: var(--ml-color-border-strong)
	 * --ml-radio-circle-border-radius: var(--ml-radius-full)
	 *
	 * Dot
	 * --ml-radio-dot-size: 0.5rem
	 * --ml-radio-dot-color: var(--ml-color-primary)
	 *
	 * Checked
	 * --ml-radio-checked-border-color: var(--ml-color-primary)
	 * --ml-radio-checked-bg: var(--ml-color-primary-subtle)
	 * --ml-radio-checked-hover-border-color: var(--ml-color-primary-hover)
	 * --ml-radio-checked-hover-dot-color: var(--ml-color-primary-hover)
	 *
	 * Hover
	 * --ml-radio-hover-border-color: var(--ml-color-primary)
	 *
	 * Focus
	 * --ml-radio-focus-border-color: var(--ml-color-primary)
	 * --ml-radio-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Label
	 * --ml-radio-label-font-size: var(--ml-text-sm)
	 * --ml-radio-label-font-weight: var(--ml-font-medium)
	 * --ml-radio-label-color: var(--ml-color-text-secondary)
	 * --ml-radio-label-line-height: 1.25rem
	 *
	 * Hint
	 * --ml-radio-hint-font-size: var(--ml-text-sm)
	 * --ml-radio-hint-color: var(--ml-color-text-muted)
	 *
	 * Gap
	 * --ml-radio-gap: var(--ml-space-3)
	 *
	 * Disabled
	 * --ml-radio-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-radio-transition-duration: var(--ml-duration-150)
	 * --ml-radio-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-radio {
		display: inline-flex;
		align-items: flex-start;
		gap: var(--ml-radio-gap, var(--ml-space-3));
		cursor: pointer;
		user-select: none;
	}

	.ml-radio--disabled {
		cursor: not-allowed;
	}

	.ml-radio--disabled .ml-radio__circle,
	.ml-radio--disabled .ml-radio__label {
		opacity: var(--ml-radio-disabled-opacity, 0.5);
	}

	.ml-radio__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-radio__circle {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-radio-circle-size, 1.25rem);
		height: var(--ml-radio-circle-size, 1.25rem);
		background-color: var(--ml-radio-circle-bg, var(--ml-color-input-bg));
		border: var(--ml-radio-circle-border-width, var(--ml-border)) solid var(--ml-radio-circle-border-color, var(--ml-color-border-strong));
		border-radius: var(--ml-radio-circle-border-radius, var(--ml-radius-full));
		transition:
			background-color var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out)),
			border-color var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio__input:focus-visible + .ml-radio__circle {
		border-color: var(--ml-radio-focus-border-color, var(--ml-color-primary));
		box-shadow: var(--ml-radio-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-radio--checked .ml-radio__circle {
		border-color: var(--ml-radio-checked-border-color, var(--ml-color-primary));
		background-color: var(--ml-radio-checked-bg, var(--ml-color-primary-subtle));
	}

	.ml-radio:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-hover-border-color, var(--ml-color-primary));
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__circle {
		border-color: var(--ml-radio-checked-hover-border-color, var(--ml-color-primary-hover));
	}

	.ml-radio__dot {
		width: var(--ml-radio-dot-size, 0.5rem);
		height: var(--ml-radio-dot-size, 0.5rem);
		border-radius: var(--ml-radio-circle-border-radius, var(--ml-radius-full));
		background-color: var(--ml-radio-dot-color, var(--ml-color-primary));
		transform: scale(0);
		transition: transform var(--ml-radio-transition-duration, var(--ml-duration-150)) var(--ml-radio-transition-easing, var(--ml-ease-in-out));
	}

	.ml-radio--checked .ml-radio__dot {
		transform: scale(1);
	}

	.ml-radio--checked:hover:not(.ml-radio--disabled) .ml-radio__dot {
		background-color: var(--ml-radio-checked-hover-dot-color, var(--ml-color-primary-hover));
	}

	/* --- Size variants --- */
	.ml-radio--sm {
		--ml-radio-circle-size: 1rem;
		--ml-radio-dot-size: 0.375rem;
	}

	.ml-radio--md {
		--ml-radio-circle-size: 1.25rem;
		--ml-radio-dot-size: 0.5rem;
	}

	.ml-radio--lg {
		--ml-radio-circle-size: 1.5rem;
		--ml-radio-dot-size: 0.625rem;
		--ml-radio-label-font-size: var(--ml-text-base);
		--ml-radio-label-line-height: 1.5rem;
	}

	.ml-radio__label {
		font-size: var(--ml-radio-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-radio-label-font-weight, var(--ml-font-medium));
		color: var(--ml-radio-label-color, var(--ml-color-text-secondary));
		line-height: var(--ml-radio-label-line-height, 1.25rem);
	}

	.ml-radio__hint {
		display: block;
		margin-top: var(--ml-space-0-5);
		margin-left: calc(var(--ml-radio-circle-size, 1.25rem) + var(--ml-radio-gap, var(--ml-space-3)));
		font-size: var(--ml-radio-hint-font-size, var(--ml-text-sm));
		color: var(--ml-radio-hint-color, var(--ml-color-text-muted));
		line-height: var(--ml-leading-tight);
	}
`;
