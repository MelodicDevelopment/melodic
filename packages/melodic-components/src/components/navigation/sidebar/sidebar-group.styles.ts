import { css } from '@melodicdev/core';

export const sidebarGroupStyles = () => css`
	:host {
		--ml-sidebar-group-padding-y: var(--ml-space-1);
		--ml-sidebar-group-label-padding-y: var(--ml-space-2);
		--ml-sidebar-group-label-padding-x: var(--ml-space-4);
		--ml-sidebar-group-label-font-size: var(--ml-text-xs);
		--ml-sidebar-group-label-font-weight: var(--ml-font-semibold);
		--ml-sidebar-group-label-color: var(--ml-color-text-muted);
		--ml-sidebar-group-label-letter-spacing: 0.05em;
		--ml-sidebar-group-items-gap: var(--ml-space-0-5);
		--ml-sidebar-group-items-padding-x: var(--ml-space-2);

		display: block;
	}

	.ml-sidebar-group {
		padding: var(--ml-sidebar-group-padding-y) 0;
	}

	.ml-sidebar-group__label {
		display: block;
		padding: var(--ml-sidebar-group-label-padding-y) var(--ml-sidebar-group-label-padding-x);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-sidebar-group-label-font-size);
		font-weight: var(--ml-sidebar-group-label-font-weight);
		color: var(--ml-sidebar-group-label-color);
		text-transform: uppercase;
		letter-spacing: var(--ml-sidebar-group-label-letter-spacing);
		line-height: var(--ml-leading-tight);
	}

	.ml-sidebar-group__items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-group-items-gap);
		padding: 0 var(--ml-sidebar-group-items-padding-x);
	}
`;
