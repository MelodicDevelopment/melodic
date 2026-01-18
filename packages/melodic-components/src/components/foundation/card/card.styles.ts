import { css } from '@melodicdev/core';

export const cardStyles = () => css`
	:host {
		display: block;
	}

	.ml-card {
		background-color: var(--ml-color-surface);
		border-radius: var(--ml-radius-lg);
		overflow: hidden;
	}

	/* Variants */
	.ml-card--default {
		border: var(--ml-border) solid var(--ml-color-border);
		box-shadow: var(--ml-shadow-xs);
	}

	.ml-card--outlined {
		border: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-card--elevated {
		border: var(--ml-border) solid var(--ml-color-border-muted);
		box-shadow: var(--ml-shadow-md);
	}

	.ml-card--filled {
		background-color: var(--ml-color-surface-raised);
		border: var(--ml-border) solid transparent;
	}

	/* Hoverable */
	.ml-card--hoverable {
		transition:
			box-shadow var(--ml-duration-200) var(--ml-ease-in-out),
			border-color var(--ml-duration-200) var(--ml-ease-in-out);
	}

	.ml-card--hoverable:hover {
		border-color: var(--ml-color-border-strong);
		box-shadow: var(--ml-shadow-md);
	}

	/* Clickable */
	.ml-card--clickable {
		cursor: pointer;
	}

	.ml-card--clickable:focus-visible {
		outline: none;
		border-color: var(--ml-color-primary);
		box-shadow: var(--ml-shadow-focus-ring);
	}

	/* Header */
	.ml-card__header {
		padding: var(--ml-space-4) var(--ml-space-5);
		border-bottom: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-card__header ::slotted(*) {
		margin: 0;
	}

	/* Body */
	.ml-card__body {
		padding: var(--ml-space-5);
	}

	/* Footer */
	.ml-card__footer {
		padding: var(--ml-space-4) var(--ml-space-5);
		border-top: var(--ml-border) solid var(--ml-color-border);
		background-color: var(--ml-card-footer-bg);
	}
`;
