import { css } from '@melodicdev/core';

export const dropdownStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-dropdown {
		position: relative;
		display: inline-block;
	}

	.ml-dropdown__trigger {
		display: inline-block;
		cursor: pointer;
	}

	.ml-dropdown__menu {
		position: fixed;
		inset: unset;
		margin: 0;
		padding: var(--ml-space-1);
		border: 1px solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		background-color: var(--ml-color-surface);
		color: var(--ml-color-text);
		box-shadow: var(--ml-shadow-lg);
		min-width: 180px;
		overflow: visible;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-duration-150) var(--ml-ease-out),
			transform var(--ml-duration-150) var(--ml-ease-out),
			overlay var(--ml-duration-150) var(--ml-ease-out) allow-discrete,
			display var(--ml-duration-150) var(--ml-ease-out) allow-discrete;
	}

	.ml-dropdown__menu:not(:popover-open) {
		display: none;
	}

	.ml-dropdown__menu:popover-open {
		opacity: 1;
		transform: scale(1);
	}

	@starting-style {
		.ml-dropdown__menu:popover-open {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.ml-dropdown__arrow {
		position: absolute;
		width: 8px;
		height: 8px;
		background-color: var(--ml-color-surface);
		border: 1px solid var(--ml-color-border);
		transform: rotate(45deg);
	}

	.ml-dropdown__menu[data-placement^='top'] .ml-dropdown__arrow {
		border-top: none;
		border-left: none;
	}

	.ml-dropdown__menu[data-placement^='bottom'] .ml-dropdown__arrow {
		border-bottom: none;
		border-right: none;
	}

	.ml-dropdown__menu[data-placement^='left'] .ml-dropdown__arrow {
		border-bottom: none;
		border-left: none;
	}

	.ml-dropdown__menu[data-placement^='right'] .ml-dropdown__arrow {
		border-top: none;
		border-right: none;
	}
`;
