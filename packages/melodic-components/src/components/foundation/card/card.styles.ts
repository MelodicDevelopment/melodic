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
	}

	.ml-card--outlined {
		border: var(--ml-border-2) solid var(--ml-color-border-strong);
	}

	.ml-card--elevated {
		box-shadow: var(--ml-shadow-md);
	}

	.ml-card--filled {
		background-color: var(--ml-color-surface-raised);
	}

	/* Hoverable */
	.ml-card--hoverable {
		transition:
			box-shadow var(--ml-duration-200) var(--ml-ease-in-out),
			transform var(--ml-duration-200) var(--ml-ease-in-out);
	}

	.ml-card--hoverable:hover {
		box-shadow: var(--ml-shadow-lg);
		transform: translateY(-2px);
	}

	/* Clickable */
	.ml-card--clickable {
		cursor: pointer;
	}

	.ml-card--clickable:focus-visible {
		outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
		outline-offset: var(--ml-focus-ring-offset);
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
		background-color: var(--ml-color-surface-raised);
	}
`;
