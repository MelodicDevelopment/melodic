import { css } from '@melodicdev/core';

export const listItemStyles = () => css`
	:host {
		display: block;
		padding: var(--_ml-list-padding, var(--ml-space-3) 0);
	}

	:host([disabled]) {
		opacity: 0.5;
		pointer-events: none;
	}

	:host([interactive]) {
		cursor: pointer;
	}

	:host([interactive]:hover) {
		background-color: var(--ml-color-bg-secondary);
	}

	:host([interactive]:focus-visible) {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: -2px;
		border-radius: var(--ml-radius-md);
	}

	:host([interactive]) .ml-li {
		padding-inline: var(--ml-space-3);
	}

	.ml-li {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-li__leading {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.ml-li__content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-li__primary {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-normal);
	}

	.ml-li__secondary {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-normal);
	}

	.ml-li__trailing {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-left: auto;
	}
`;
