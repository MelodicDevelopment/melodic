import { css } from '@melodicdev/core';

export const dropdownItemStyles = () => css`
	:host {
		/* Item base */
		--ml-dropdown-item-gap: var(--ml-space-2);
		--ml-dropdown-item-padding: var(--ml-space-2);
		--ml-dropdown-item-radius: var(--ml-radius-md);
		--ml-dropdown-item-font-size: 14px;
		--ml-dropdown-item-line-height: 20px;
		--ml-dropdown-item-color: var(--ml-color-text);
		--ml-dropdown-item-transition: var(--ml-duration-100) var(--ml-ease-out);

		/* Item hover/focused */
		--ml-dropdown-item-hover-bg: var(--ml-color-surface-hover);

		/* Item disabled */
		--ml-dropdown-item-disabled-opacity: 0.5;

		/* Item destructive */
		--ml-dropdown-item-destructive-color: var(--ml-color-error);
		--ml-dropdown-item-destructive-hover-bg: var(--ml-color-error-subtle);

		/* Icon */
		--ml-dropdown-item-icon-color: var(--ml-color-text-secondary);

		/* Addon (shortcut text) */
		--ml-dropdown-item-addon-font-size: 12px;
		--ml-dropdown-item-addon-color: var(--ml-color-text-tertiary);

		display: block;
	}

	.ml-dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--ml-dropdown-item-gap);
		padding: var(--ml-dropdown-item-padding) var(--ml-dropdown-item-padding);
		border-radius: var(--ml-dropdown-item-radius);
		font-size: var(--ml-dropdown-item-font-size);
		line-height: var(--ml-dropdown-item-line-height);
		color: var(--ml-dropdown-item-color);
		cursor: pointer;
		user-select: none;
		transition: background-color var(--ml-dropdown-item-transition);
	}

	.ml-dropdown-item:hover {
		background-color: var(--ml-dropdown-item-hover-bg);
	}

	.ml-dropdown-item--focused {
		background-color: var(--ml-dropdown-item-hover-bg);
	}

	.ml-dropdown-item--disabled {
		opacity: var(--ml-dropdown-item-disabled-opacity);
		cursor: not-allowed;
	}

	.ml-dropdown-item--disabled:hover {
		background-color: transparent;
	}

	.ml-dropdown-item--destructive {
		color: var(--ml-dropdown-item-destructive-color);
	}

	.ml-dropdown-item--destructive:hover {
		background-color: var(--ml-dropdown-item-destructive-hover-bg);
	}

	.ml-dropdown-item--destructive.ml-dropdown-item--focused {
		background-color: var(--ml-dropdown-item-destructive-hover-bg);
	}

	.ml-dropdown-item__icon {
		flex-shrink: 0;
		color: var(--ml-dropdown-item-icon-color);
	}

	.ml-dropdown-item--destructive .ml-dropdown-item__icon {
		color: var(--ml-dropdown-item-destructive-color);
	}

	.ml-dropdown-item__label {
		flex: 1;
		min-width: 0;
	}

	.ml-dropdown-item__addon {
		flex-shrink: 0;
		font-size: var(--ml-dropdown-item-addon-font-size);
		color: var(--ml-dropdown-item-addon-color);
	}
`;
