import { css } from '@melodicdev/core';

export const stackStyles = () => css`
	:host {
		/* ── Stack: layout ──
		   Set from the component's properties; override any of them from a
		   parent rule to change the layout without touching the markup. */
		--ml-stack-direction: row;
		--ml-stack-gap: var(--ml-space-4);
		--ml-stack-align: stretch;
		--ml-stack-justify: flex-start;
		--ml-stack-wrap: nowrap;

		display: block;
	}

	.ml-stack {
		display: flex;
		flex-direction: var(--ml-stack-direction);
		gap: var(--ml-stack-gap);
		align-items: var(--ml-stack-align);
		justify-content: var(--ml-stack-justify);
		flex-wrap: var(--ml-stack-wrap);
	}
`;
