import { css } from '@melodicdev/core';

export const tabStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Tab base
	 * --ml-tab-gap: var(--ml-space-2)
	 * --ml-tab-padding-y: var(--ml-space-2)
	 * --ml-tab-padding-x: var(--ml-space-4)
	 * --ml-tab-font-family: var(--ml-font-sans)
	 * --ml-tab-font-weight: var(--ml-font-medium)
	 * --ml-tab-color: var(--ml-color-text-secondary)
	 * --ml-tab-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Tab hover
	 * --ml-tab-hover-color: var(--ml-color-text)
	 *
	 * Tab focus
	 * --ml-tab-focus-color: var(--ml-color-primary)
	 *
	 * Tab active
	 * --ml-tab-active-color: var(--ml-color-primary)
	 *
	 * Tab disabled
	 * --ml-tab-disabled-color: var(--ml-color-text-muted)
	 *
	 * Label
	 * --ml-tab-label-line-height: var(--ml-leading-tight)
	 */

	:host {
		display: contents;
	}

	.ml-tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-tab-gap, var(--ml-space-2));
		padding: var(--ml-tab-padding-y, var(--ml-space-2)) var(--ml-tab-padding-x, var(--ml-space-4));
		font-family: var(--ml-tab-font-family, var(--ml-font-sans));
		font-weight: var(--ml-tab-font-weight, var(--ml-font-medium));
		font-size: inherit;
		color: var(--ml-tab-color, var(--ml-color-text-secondary));
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			background-color var(--ml-tab-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-tab:hover:not(:disabled) {
		color: var(--ml-tab-hover-color, var(--ml-color-text));
	}

	.ml-tab:focus-visible {
		outline: 2px solid var(--ml-tab-focus-color, var(--ml-color-primary));
		outline-offset: 2px;
	}

	.ml-tab--active {
		color: var(--ml-tab-active-color, var(--ml-color-primary));
	}

	.ml-tab--disabled {
		color: var(--ml-tab-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
	}

	.ml-tab__label {
		line-height: var(--ml-tab-label-line-height, var(--ml-leading-tight));
	}
`;
