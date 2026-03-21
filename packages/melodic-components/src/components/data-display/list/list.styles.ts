import { css } from '@melodicdev/core';

export const listStyles = () => css`
	:host {
		display: block;

		/* ── List: divider ── */
		--ml-list-divider-width: var(--ml-border);
		--ml-list-divider-color: var(--ml-color-border);
	}

	.ml-list {
		display: flex;
		flex-direction: column;
	}

	/* Size variants — set CSS variable consumed by ml-list-item */
	.ml-list--sm {
		--_ml-list-padding: var(--ml-space-2) 0;
	}

	.ml-list--md {
		--_ml-list-padding: var(--ml-space-3) 0;
	}

	.ml-list--lg {
		--_ml-list-padding: var(--ml-space-4) 0;
	}

	/* Default variant: dividers between items */
	.ml-list--default ::slotted(ml-list-item:not(:last-of-type)) {
		border-bottom: var(--ml-list-divider-width) solid var(--ml-list-divider-color);
	}
`;
