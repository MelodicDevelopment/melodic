import { css } from '@melodicdev/core';

export const breadcrumbStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Gap between breadcrumb items
	 * --ml-breadcrumb-gap: var(--ml-space-1)
	 */

	:host {
		display: block;
	}

	.ml-breadcrumb__list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--ml-breadcrumb-gap, var(--ml-space-1));
		list-style: none;
		margin: 0;
		padding: 0;
	}
`;
