import { css } from '@melodicdev/core';

export const listItemStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-list-item-gap: var(--ml-space-3)
	 *
	 * List Item: primary text
	 * --ml-list-item-primary-font: var(--ml-font-sans)
	 * --ml-list-item-primary-size: var(--ml-text-sm)
	 * --ml-list-item-primary-weight: var(--ml-font-semibold)
	 * --ml-list-item-primary-color: var(--ml-color-text)
	 *
	 * List Item: secondary text
	 * --ml-list-item-secondary-font: var(--ml-font-sans)
	 * --ml-list-item-secondary-size: var(--ml-text-xs)
	 * --ml-list-item-secondary-color: var(--ml-color-text-secondary)
	 *
	 * List Item: interactive states
	 * --ml-list-item-hover-bg: var(--ml-color-bg-secondary)
	 * --ml-list-item-focus-color: var(--ml-color-primary)
	 * --ml-list-item-focus-radius: var(--ml-radius-md)
	 * --ml-list-item-disabled-opacity: 0.5
	 *
	 * --ml-list-item-padding: var(--_ml-list-padding, var(--ml-space-3) 0)
	 */

	:host {
		display: block;

		padding: var(--ml-list-item-padding, var(--_ml-list-padding, var(--ml-space-3) 0));
	}

	:host([disabled]) {
		opacity: var(--ml-list-item-disabled-opacity, 0.5);
		pointer-events: none;
	}

	:host([interactive]) {
		cursor: pointer;
	}

	:host([interactive]:hover) {
		background-color: var(--ml-list-item-hover-bg, var(--ml-color-bg-secondary));
	}

	:host([interactive]:focus-visible) {
		outline: 2px solid var(--ml-list-item-focus-color, var(--ml-color-primary));
		outline-offset: -2px;
		border-radius: var(--ml-list-item-focus-radius, var(--ml-radius-md));
	}

	:host([interactive]) .ml-li {
		padding-inline: var(--ml-space-3);
	}

	.ml-li {
		display: flex;
		align-items: center;
		gap: var(--ml-list-item-gap, var(--ml-space-3));
	}

	.ml-li__leading {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.ml-li__leading--hidden,
	.ml-li__trailing--hidden {
		display: none;
	}

	.ml-li__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-li__primary {
		font-family: var(--ml-list-item-primary-font, var(--ml-font-sans));
		font-size: var(--ml-list-item-primary-size, var(--ml-text-sm));
		font-weight: var(--ml-list-item-primary-weight, var(--ml-font-semibold));
		color: var(--ml-list-item-primary-color, var(--ml-color-text));
		line-height: var(--ml-leading-normal);
	}

	.ml-li__secondary {
		font-family: var(--ml-list-item-secondary-font, var(--ml-font-sans));
		font-size: var(--ml-list-item-secondary-size, var(--ml-text-xs));
		color: var(--ml-list-item-secondary-color, var(--ml-color-text-secondary));
		line-height: var(--ml-leading-normal);
	}

	.ml-li__trailing {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-left: auto;
	}
`;
