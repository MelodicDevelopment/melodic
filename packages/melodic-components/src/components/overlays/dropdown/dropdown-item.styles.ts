import { css } from '@melodicdev/core';

export const dropdownItemStyles = () => css`
	:host {
		display: block;
	}

	.ml-dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2) var(--ml-space-2);
		border-radius: var(--ml-radius-md);
		font-size: 14px;
		line-height: 20px;
		color: var(--ml-color-text);
		cursor: pointer;
		user-select: none;
		transition: background-color var(--ml-duration-100) var(--ml-ease-out);
	}

	.ml-dropdown-item:hover {
		background-color: var(--ml-color-surface-hover);
	}

	.ml-dropdown-item--focused {
		background-color: var(--ml-color-surface-hover);
	}

	.ml-dropdown-item--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ml-dropdown-item--disabled:hover {
		background-color: transparent;
	}

	.ml-dropdown-item--destructive {
		color: var(--ml-color-error);
	}

	.ml-dropdown-item--destructive:hover {
		background-color: var(--ml-color-error-subtle);
	}

	.ml-dropdown-item--destructive.ml-dropdown-item--focused {
		background-color: var(--ml-color-error-subtle);
	}

	.ml-dropdown-item__icon {
		flex-shrink: 0;
		color: var(--ml-color-text-secondary);
	}

	.ml-dropdown-item--destructive .ml-dropdown-item__icon {
		color: var(--ml-color-error);
	}

	.ml-dropdown-item__label {
		flex: 1;
		min-width: 0;
	}

	.ml-dropdown-item__addon {
		flex-shrink: 0;
		font-size: 12px;
		color: var(--ml-color-text-tertiary);
	}
`;
