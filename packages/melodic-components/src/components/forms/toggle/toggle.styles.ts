import { css } from '@melodicdev/core';

export const toggleStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Track
	 * --ml-toggle-track-width: 2.75rem
	 * --ml-toggle-track-height: 1.5rem
	 * --ml-toggle-track-bg: var(--ml-color-toggle-off)
	 * --ml-toggle-track-hover-bg: var(--ml-color-toggle-off-hover)
	 * --ml-toggle-track-checked-bg: var(--ml-color-primary)
	 * --ml-toggle-track-checked-hover-bg: var(--ml-color-primary-hover)
	 * --ml-toggle-track-border-radius: var(--ml-radius-full)
	 *
	 * Thumb
	 * --ml-toggle-thumb-size: 1.25rem
	 * --ml-toggle-thumb-bg: var(--ml-white)
	 * --ml-toggle-thumb-border-radius: var(--ml-radius-full)
	 * --ml-toggle-thumb-shadow: var(--ml-shadow-sm)
	 * --ml-toggle-thumb-offset: 0.125rem
	 * --ml-toggle-thumb-translate: 1.25rem
	 *
	 * Focus
	 * --ml-toggle-focus-shadow: var(--ml-shadow-focus-ring)
	 *
	 * Label
	 * --ml-toggle-label-font-size: var(--ml-text-sm)
	 * --ml-toggle-label-font-weight: var(--ml-font-medium)
	 * --ml-toggle-label-color: var(--ml-color-text-secondary)
	 *
	 * Hint
	 * --ml-toggle-hint-font-size: var(--ml-text-sm)
	 * --ml-toggle-hint-color: var(--ml-color-text-muted)
	 *
	 * Error
	 * --ml-toggle-error-track-bg: var(--ml-color-danger)
	 * --ml-toggle-error-color: var(--ml-color-danger)
	 * --ml-toggle-error-margin-top: var(--ml-space-1)
	 * --ml-toggle-error-line-height: var(--ml-leading-tight)
	 *
	 * Gap
	 * --ml-toggle-gap: var(--ml-space-3)
	 *
	 * Disabled
	 * --ml-toggle-disabled-opacity: 0.5
	 *
	 * Transition
	 * --ml-toggle-transition-duration: var(--ml-duration-200)
	 * --ml-toggle-transition-easing: var(--ml-ease-in-out)
	 */

	:host {
		display: block;
	}

	.ml-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-toggle-gap, var(--ml-space-3));
		cursor: pointer;
		user-select: none;
	}

	.ml-toggle--disabled {
		cursor: not-allowed;
		pointer-events: none;
	}

	.ml-toggle--disabled .ml-toggle__track,
	.ml-toggle--disabled .ml-toggle__label {
		opacity: var(--ml-toggle-disabled-opacity, 0.5);
	}

	.ml-toggle__input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.ml-toggle__track {
		position: relative;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		width: var(--ml-toggle-track-width, 2.75rem);
		height: var(--ml-toggle-track-height, 1.5rem);
		background-color: var(--ml-toggle-track-bg, var(--ml-color-toggle-off));
		border-radius: var(--ml-toggle-track-border-radius, var(--ml-radius-full));
		transition:
			background-color var(--ml-toggle-transition-duration, var(--ml-duration-200)) var(--ml-toggle-transition-easing, var(--ml-ease-in-out)),
			box-shadow var(--ml-toggle-transition-duration, var(--ml-duration-200)) var(--ml-toggle-transition-easing, var(--ml-ease-in-out));
	}

	.ml-toggle__input:focus-visible + .ml-toggle__track {
		box-shadow: var(--ml-toggle-focus-shadow, var(--ml-shadow-focus-ring));
	}

	.ml-toggle--checked .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-bg, var(--ml-color-primary));
	}

	.ml-toggle:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-hover-bg, var(--ml-color-toggle-off-hover));
	}

	.ml-toggle--checked:hover:not(.ml-toggle--disabled) .ml-toggle__track {
		background-color: var(--ml-toggle-track-checked-hover-bg, var(--ml-color-primary-hover));
	}

	.ml-toggle__thumb {
		position: absolute;
		width: var(--ml-toggle-thumb-size, 1.25rem);
		height: var(--ml-toggle-thumb-size, 1.25rem);
		left: var(--ml-toggle-thumb-offset, 0.125rem);
		background-color: var(--ml-toggle-thumb-bg, var(--ml-white));
		border-radius: var(--ml-toggle-thumb-border-radius, var(--ml-radius-full));
		box-shadow: var(--ml-toggle-thumb-shadow, var(--ml-shadow-sm));
		transition: transform var(--ml-toggle-transition-duration, var(--ml-duration-200)) var(--ml-toggle-transition-easing, var(--ml-ease-in-out));
	}

	/* --- Size variants --- */
	.ml-toggle--sm {
		--ml-toggle-track-width: 2.25rem;
		--ml-toggle-track-height: 1.25rem;
		--ml-toggle-thumb-size: 1rem;
		--ml-toggle-thumb-translate: 1rem;
	}

	.ml-toggle--sm.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate, 1.25rem));
	}

	.ml-toggle--md {
		--ml-toggle-track-width: 2.75rem;
		--ml-toggle-track-height: 1.5rem;
		--ml-toggle-thumb-size: 1.25rem;
		--ml-toggle-thumb-translate: 1.25rem;
	}

	.ml-toggle--md.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate, 1.25rem));
	}

	.ml-toggle--lg {
		--ml-toggle-track-width: 3rem;
		--ml-toggle-track-height: 1.75rem;
		--ml-toggle-thumb-size: 1.5rem;
		--ml-toggle-thumb-translate: 1.25rem;
		--ml-toggle-label-font-size: var(--ml-text-base);
	}

	.ml-toggle--lg.ml-toggle--checked .ml-toggle__thumb {
		transform: translateX(var(--ml-toggle-thumb-translate, 1.25rem));
	}

	.ml-toggle__label {
		font-size: var(--ml-toggle-label-font-size, var(--ml-text-sm));
		font-weight: var(--ml-toggle-label-font-weight, var(--ml-font-medium));
		color: var(--ml-toggle-label-color, var(--ml-color-text-secondary));
	}

	.ml-toggle__hint {
		display: block;
		margin-top: var(--ml-space-1);
		margin-left: calc(var(--ml-toggle-track-width, 2.75rem) + var(--ml-toggle-gap, var(--ml-space-3)));
		font-size: var(--ml-toggle-hint-font-size, var(--ml-text-sm));
		color: var(--ml-toggle-hint-color, var(--ml-color-text-muted));
		line-height: var(--ml-leading-tight);
	}

	.ml-toggle__error {
		display: block;
		margin-top: var(--ml-toggle-error-margin-top, var(--ml-space-1));
		margin-left: calc(var(--ml-toggle-track-width, 2.75rem) + var(--ml-toggle-gap, var(--ml-space-3)));
		font-size: var(--ml-toggle-hint-font-size, var(--ml-text-sm));
		color: var(--ml-toggle-error-color, var(--ml-color-danger));
		line-height: var(--ml-toggle-error-line-height, var(--ml-leading-tight));
	}

	.ml-toggle--error.ml-toggle--checked .ml-toggle__track {
		background-color: var(--ml-toggle-error-track-bg, var(--ml-color-danger));
	}
`;
