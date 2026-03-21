import { css } from '@melodicdev/core';

export const breadcrumbStyles = () => css`
	:host {
		/* Gap between breadcrumb items */
		--ml-breadcrumb-gap: var(--ml-space-1);

		display: block;
	}

	.ml-breadcrumb__list {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--ml-breadcrumb-gap);
		list-style: none;
		margin: 0;
		padding: 0;
	}
`;
