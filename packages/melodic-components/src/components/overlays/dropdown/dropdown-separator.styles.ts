import { css } from '@melodicdev/core';

export const dropdownSeparatorStyles = () => css`
	:host {
		display: block;
	}

	.ml-dropdown-separator {
		height: 1px;
		margin: var(--ml-space-1) 0;
		background-color: var(--ml-color-border);
	}
`;
