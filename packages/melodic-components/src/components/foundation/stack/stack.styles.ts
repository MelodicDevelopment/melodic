import { css } from '@melodicdev/core';

export const stackStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-stack-direction: row
	 * --ml-stack-gap: var(--ml-space-4)
	 * --ml-stack-align: stretch
	 * --ml-stack-justify: flex-start
	 * --ml-stack-wrap: nowrap
	 */

	:host {
		/* ── Stack: layout ──
		   Set from the component's properties; override any of them from a
		   parent rule to change the layout without touching the markup. */

		display: block;
	}

	.ml-stack {
		display: flex;
		flex-direction: var(--ml-stack-direction, row);
		gap: var(--ml-stack-gap, var(--ml-space-4));
		align-items: var(--ml-stack-align, stretch);
		justify-content: var(--ml-stack-justify, flex-start);
		flex-wrap: var(--ml-stack-wrap, nowrap);
	}
`;
