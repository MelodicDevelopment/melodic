import { css } from '@melodicdev/core';

export const dropdownStyles = () => css`
	:host {
		/* Menu */
		--ml-dropdown-padding: var(--ml-space-1);
		--ml-dropdown-border-color: var(--ml-color-border);
		--ml-dropdown-radius: var(--ml-radius-lg);
		--ml-dropdown-bg: var(--ml-color-surface);
		--ml-dropdown-color: var(--ml-color-text);
		--ml-dropdown-shadow: var(--ml-shadow-lg);
		--ml-dropdown-min-width: 180px;
		--ml-dropdown-transition: var(--ml-duration-150) var(--ml-ease-out);

		/* Arrow */
		--ml-dropdown-arrow-size: 8px;
		--ml-dropdown-arrow-bg: var(--ml-color-surface);
		--ml-dropdown-arrow-border-color: var(--ml-color-border);

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
		padding: var(--ml-dropdown-padding);
		border: 1px solid var(--ml-dropdown-border-color);
		border-radius: var(--ml-dropdown-radius);
		background-color: var(--ml-dropdown-bg);
		color: var(--ml-dropdown-color);
		box-shadow: var(--ml-dropdown-shadow);
		min-width: var(--ml-dropdown-min-width);
		overflow: visible;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity var(--ml-dropdown-transition),
			transform var(--ml-dropdown-transition),
			overlay var(--ml-dropdown-transition) allow-discrete,
			display var(--ml-dropdown-transition) allow-discrete;
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
		width: var(--ml-dropdown-arrow-size);
		height: var(--ml-dropdown-arrow-size);
		background-color: var(--ml-dropdown-arrow-bg);
		border: 1px solid var(--ml-dropdown-arrow-border-color);
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
