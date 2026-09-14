import { css } from '@melodicdev/core';

export const popoverStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Content panel
	 * --ml-popover-padding-y: var(--ml-space-3)
	 * --ml-popover-padding-x: var(--ml-space-4)
	 * --ml-popover-border-color: var(--ml-color-border)
	 * --ml-popover-radius: var(--ml-radius-lg)
	 * --ml-popover-bg: var(--ml-color-surface)
	 * --ml-popover-color: var(--ml-color-text)
	 * --ml-popover-shadow: var(--ml-shadow-lg)
	 * --ml-popover-content-overflow: visible
	 * --ml-popover-transition: var(--ml-duration-150) var(--ml-ease-out)
	 *
	 * Arrow
	 * --ml-popover-arrow-size: 8px
	 * --ml-popover-arrow-bg: var(--ml-color-surface)
	 * --ml-popover-arrow-border-color: var(--ml-color-border)
	 */

	:host {
		display: inline-block;
	}

	.ml-popover {
		position: relative;
		display: inline-block;
	}

	.ml-popover__trigger {
		display: inline-block;
		cursor: pointer;
	}

	.ml-popover__content {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-popover-padding-y, var(--ml-space-3)) var(--ml-popover-padding-x, var(--ml-space-4));
		border: 1px solid var(--ml-popover-border-color, var(--ml-color-border));
		border-radius: var(--ml-popover-radius, var(--ml-radius-lg));
		background-color: var(--ml-popover-bg, var(--ml-color-surface));
		color: var(--ml-popover-color, var(--ml-color-text));
		box-shadow: var(--ml-popover-shadow, var(--ml-shadow-lg));
		overflow: var(--ml-popover-content-overflow, visible);
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)),
			transform var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)),
			overlay var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)) allow-discrete,
			display var(--ml-popover-transition, var(--ml-duration-150) var(--ml-ease-out)) allow-discrete;
	}

	.ml-popover__content:not(:popover-open) {
		display: none;
	}

	.ml-popover__content:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-popover__content:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.ml-popover__arrow {
		position: absolute;
		width: var(--ml-popover-arrow-size, 8px);
		height: var(--ml-popover-arrow-size, 8px);
		background-color: var(--ml-popover-arrow-bg, var(--ml-color-surface));
		border: 1px solid var(--ml-popover-arrow-border-color, var(--ml-color-border));
		transform: rotate(45deg);
	}

	.ml-popover__content[data-placement^='top'] .ml-popover__arrow {
		border-top: none;
		border-left: none;
	}

	.ml-popover__content[data-placement^='bottom'] .ml-popover__arrow {
		border-bottom: none;
		border-right: none;
	}

	.ml-popover__content[data-placement^='left'] .ml-popover__arrow {
		border-bottom: none;
		border-left: none;
	}

	.ml-popover__content[data-placement^='right'] .ml-popover__arrow {
		border-top: none;
		border-right: none;
	}
`;
