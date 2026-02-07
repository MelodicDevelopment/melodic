import { css } from '@melodicdev/core';

export const breadcrumbStyles = () => css`
	:host {
		display: block;
	}

	.ml-breadcrumb__list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--ml-space-1);
		list-style: none;
		margin: 0;
		padding: 0;
	}
`;
