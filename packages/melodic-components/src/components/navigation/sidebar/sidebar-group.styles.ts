import { css } from '@melodicdev/core';

export const sidebarGroupStyles = () => css`
	:host {
		display: block;
	}

	.ml-sidebar-group {
		padding: var(--ml-space-1) 0;
	}

	.ml-sidebar-group__label {
		display: block;
		padding: var(--ml-space-2) var(--ml-space-4);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: var(--ml-leading-tight);
	}

	.ml-sidebar-group__items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
		padding: 0 var(--ml-space-2);
	}
`;
