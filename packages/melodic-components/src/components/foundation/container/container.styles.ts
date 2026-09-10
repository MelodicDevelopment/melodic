import { css } from '@melodicdev/core';

export const containerStyles = () => css`
	:host {
		/* ── Container: layout ── */
		--ml-container-max-width: 1024px;
		--ml-container-padding-x: var(--ml-space-4);
		--ml-container-margin-x: auto;

		display: block;
		width: 100%;
	}

	.ml-container {
		width: 100%;
		max-width: var(--ml-container-max-width);
		padding-left: var(--ml-container-padding-x);
		padding-right: var(--ml-container-padding-x);
		margin-left: var(--ml-container-margin-x);
		margin-right: var(--ml-container-margin-x);
	}
`;
