import { css } from '@melodicdev/core';

export const buttonGroupItemStyles = () => css`
	:host {
		display: inline-flex;
	}

	.ml-button-group-item {
		appearance: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-space-2);
		height: 2.5rem;
		padding: 0 var(--ml-space-3-5);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		white-space: nowrap;
		cursor: pointer;
		border: 1px solid var(--ml-color-border-strong);
		background-color: var(--ml-color-surface);
		color: var(--ml-color-text-secondary);
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out);
	}

	/* Sizes */
	:host([group-size="sm"]) .ml-button-group-item {
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		font-size: var(--ml-text-xs);
	}

	:host([group-size="lg"]) .ml-button-group-item {
		height: 2.75rem;
		padding: 0 var(--ml-space-4);
	}

	/* Border radius */
	:host(:first-child) .ml-button-group-item {
		border-radius: var(--ml-radius) 0 0 var(--ml-radius);
	}

	:host(:last-child) .ml-button-group-item {
		border-radius: 0 var(--ml-radius) var(--ml-radius) 0;
	}

	:host(:only-child) .ml-button-group-item {
		border-radius: var(--ml-radius);
	}

	:host(:not(:first-child):not(:last-child)) .ml-button-group-item {
		border-radius: 0;
	}

	/* Hover */
	.ml-button-group-item:hover:not(:disabled) {
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text);
	}

	/* Focus */
	.ml-button-group-item:focus {
		outline: none;
	}

	.ml-button-group-item:focus-visible {
		z-index: 1;
		box-shadow: var(--ml-shadow-focus-ring);
	}

	/* Active / Selected - outline variant (default) */
	:host([active]) .ml-button-group-item {
		background-color: var(--ml-color-surface-sunken);
		color: var(--ml-color-text);
		font-weight: var(--ml-font-semibold);
		z-index: 1;
	}

	:host([active]) .ml-button-group-item:hover:not(:disabled) {
		background-color: var(--ml-color-surface-sunken);
		color: var(--ml-color-text);
	}

	/* Active / Selected - solid variant */
	:host([active][group-variant="solid"]) .ml-button-group-item {
		background-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
		border-color: var(--ml-color-primary);
		font-weight: var(--ml-font-semibold);
		z-index: 1;
	}

	:host([active][group-variant="solid"]) .ml-button-group-item:hover:not(:disabled) {
		background-color: var(--ml-color-primary-hover);
		border-color: var(--ml-color-primary-hover);
		color: var(--ml-color-text-inverse);
	}

	/* Disabled */
	:host([group-disabled]) .ml-button-group-item,
	:host([disabled]) .ml-button-group-item {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;
