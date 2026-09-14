import { css } from '@melodicdev/core';

export const containerStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Container: layout
	 * --ml-container-max-width: 1024px
	 * --ml-container-padding-x: var(--ml-space-4)
	 * --ml-container-margin-x: auto
	 */

	:host {
		display: block;
		width: 100%;
	}

	.ml-container {
		width: 100%;
		max-width: var(--ml-container-max-width, 1024px);
		padding-left: var(--ml-container-padding-x, var(--ml-space-4));
		padding-right: var(--ml-container-padding-x, var(--ml-space-4));
		margin-left: var(--ml-container-margin-x, auto);
		margin-right: var(--ml-container-margin-x, auto);
	}
`;
