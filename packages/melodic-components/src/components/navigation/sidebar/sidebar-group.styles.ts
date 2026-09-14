import { css } from '@melodicdev/core';

export const sidebarGroupStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-sidebar-group-padding-y: var(--ml-space-1)
	 * --ml-sidebar-group-label-padding-y: var(--ml-space-2)
	 * --ml-sidebar-group-label-padding-x: var(--ml-space-4)
	 * --ml-sidebar-group-label-font-size: var(--ml-text-xs)
	 * --ml-sidebar-group-label-font-weight: var(--ml-font-semibold)
	 * --ml-sidebar-group-label-color: var(--ml-color-text-muted)
	 * --ml-sidebar-group-label-letter-spacing: 0.05em
	 * --ml-sidebar-group-items-gap: var(--ml-space-0-5)
	 * --ml-sidebar-group-items-padding-x: var(--ml-space-2)
	 */

	:host {
		display: block;
	}

	.ml-sidebar-group {
		padding: var(--ml-sidebar-group-padding-y, var(--ml-space-1)) 0;
	}

	.ml-sidebar-group__label {
		display: block;
		padding: var(--ml-sidebar-group-label-padding-y, var(--ml-space-2)) var(--ml-sidebar-group-label-padding-x, var(--ml-space-4));
		font-family: var(--ml-font-sans);
		font-size: var(--ml-sidebar-group-label-font-size, var(--ml-text-xs));
		font-weight: var(--ml-sidebar-group-label-font-weight, var(--ml-font-semibold));
		color: var(--ml-sidebar-group-label-color, var(--ml-color-text-muted));
		text-transform: uppercase;
		letter-spacing: var(--ml-sidebar-group-label-letter-spacing, 0.05em);
		line-height: var(--ml-leading-tight);
	}

	.ml-sidebar-group__items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-group-items-gap, var(--ml-space-0-5));
		padding: 0 var(--ml-sidebar-group-items-padding-x, var(--ml-space-2));
	}
`;
