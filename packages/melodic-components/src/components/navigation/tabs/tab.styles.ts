import { css } from '@melodicdev/core';

export const tabStyles = () => css`
	:host {
		display: contents;
	}

	.ml-tab {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2) var(--ml-space-4);
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-medium);
		font-size: inherit;
		color: var(--ml-color-text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition:
			color var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-tab:hover:not(:disabled) {
		color: var(--ml-color-text);
	}

	.ml-tab:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: 2px;
	}

	.ml-tab--active {
		color: var(--ml-color-primary);
	}

	.ml-tab--disabled {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
	}

	.ml-tab__label {
		line-height: var(--ml-leading-tight);
	}
`;
