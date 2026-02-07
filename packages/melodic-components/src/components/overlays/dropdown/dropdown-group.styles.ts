import { css } from '@melodicdev/core';

export const dropdownGroupStyles = () => css`
	:host {
		display: block;
	}

	.ml-dropdown-group__label {
		padding: var(--ml-space-2) var(--ml-space-2) var(--ml-space-1);
		font-size: 12px;
		font-weight: 500;
		line-height: 16px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ml-color-text-tertiary);
	}
`;
