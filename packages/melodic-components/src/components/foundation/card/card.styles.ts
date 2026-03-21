import { css } from '@melodicdev/core';

export const cardStyles = () => css`
	:host {
		display: block;

		/* Background */
		--ml-card-bg: var(--ml-color-surface);
		--ml-card-footer-bg: transparent;

		/* Border */
		--ml-card-border-width: var(--ml-border);
		--ml-card-border-color: var(--ml-color-border);
		--ml-card-border-radius: var(--ml-radius-lg);

		/* Shadow */
		--ml-card-shadow: none;

		/* Spacing */
		--ml-card-header-padding-y: var(--ml-space-4);
		--ml-card-header-padding-x: var(--ml-space-5);
		--ml-card-body-padding: var(--ml-space-5);
		--ml-card-footer-padding-y: var(--ml-space-4);
		--ml-card-footer-padding-x: var(--ml-space-5);

		/* Hover state */
		--ml-card-hover-border-color: var(--ml-color-border-strong);
		--ml-card-hover-shadow: var(--ml-shadow-md);

		/* Focus state */
		--ml-card-focus-border-color: var(--ml-color-primary);
		--ml-card-focus-shadow: var(--ml-shadow-focus-ring);

		/* Transition */
		--ml-card-transition-duration: var(--ml-duration-200);
		--ml-card-transition-easing: var(--ml-ease-in-out);
	}

	.ml-card {
		background-color: var(--ml-card-bg);
		border-radius: var(--ml-card-border-radius);
		overflow: hidden;
		height: 100%;
	}

	.ml-card--default {
		border: var(--ml-card-border-width) solid var(--ml-card-border-color);
		box-shadow: var(--ml-shadow-xs);
	}

	.ml-card--outlined {
		border: var(--ml-card-border-width) solid var(--ml-card-border-color);
	}

	.ml-card--elevated {
		border: var(--ml-card-border-width) solid var(--ml-color-border-muted);
		box-shadow: var(--ml-shadow-md);
	}

	.ml-card--filled {
		background-color: var(--ml-color-surface-raised);
		border: var(--ml-card-border-width) solid transparent;
	}

	.ml-card--hoverable {
		transition:
			box-shadow var(--ml-card-transition-duration) var(--ml-card-transition-easing),
			border-color var(--ml-card-transition-duration) var(--ml-card-transition-easing);
	}

	.ml-card--hoverable:hover {
		border-color: var(--ml-card-hover-border-color);
		box-shadow: var(--ml-card-hover-shadow);
	}

	.ml-card--clickable {
		cursor: pointer;
	}

	.ml-card--clickable:focus-visible {
		outline: none;
		border-color: var(--ml-card-focus-border-color);
		box-shadow: var(--ml-card-focus-shadow);
	}

	.ml-card__header {
		padding: var(--ml-card-header-padding-y) var(--ml-card-header-padding-x);
		border-bottom: var(--ml-card-border-width) solid var(--ml-card-border-color);
	}

	.ml-card__header ::slotted(*) {
		margin: 0;
	}

	.ml-card__body {
		padding: var(--ml-card-body-padding);
	}

	.ml-card__footer {
		padding: var(--ml-card-footer-padding-y) var(--ml-card-footer-padding-x);
		border-top: var(--ml-card-border-width) solid var(--ml-card-border-color);
		background-color: var(--ml-card-footer-bg);
	}
`;
