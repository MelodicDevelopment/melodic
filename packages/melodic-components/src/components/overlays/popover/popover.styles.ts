import { css } from '@melodicdev/core';

export const popoverStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-popover {
		position: relative;
		display: inline-block;
	}

	.ml-popover__trigger {
		display: inline-block;
		cursor: pointer;
	}

	.ml-popover__content {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-space-3) var(--ml-space-4);
		border: 1px solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		background-color: var(--ml-color-surface);
		color: var(--ml-color-text);
		box-shadow: var(--ml-shadow-lg);
		overflow: visible;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-duration-150) var(--ml-ease-out),
			transform var(--ml-duration-150) var(--ml-ease-out),
			overlay var(--ml-duration-150) var(--ml-ease-out) allow-discrete,
			display var(--ml-duration-150) var(--ml-ease-out) allow-discrete;
	}

	.ml-popover__content:not(:popover-open) {
		display: none;
	}

	.ml-popover__content:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-popover__content:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.ml-popover__arrow {
		position: absolute;
		width: 8px;
		height: 8px;
		background-color: var(--ml-color-surface);
		border: 1px solid var(--ml-color-border);
		transform: rotate(45deg);
	}

	.ml-popover__content[data-placement^='top'] .ml-popover__arrow {
		border-top: none;
		border-left: none;
	}

	.ml-popover__content[data-placement^='bottom'] .ml-popover__arrow {
		border-bottom: none;
		border-right: none;
	}

	.ml-popover__content[data-placement^='left'] .ml-popover__arrow {
		border-bottom: none;
		border-left: none;
	}

	.ml-popover__content[data-placement^='right'] .ml-popover__arrow {
		border-top: none;
		border-right: none;
	}
`;
