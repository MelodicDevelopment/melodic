import { css } from '@melodicdev/core';

export const sidebarItemStyles = () => css`
	:host {
		display: block;
	}

	.ml-sidebar-item {
		--level: 0;
	}

	.ml-sidebar-item__link {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-space-2) var(--ml-space-3);
		padding-left: calc(var(--ml-space-3) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-radius: var(--ml-radius);
		background: transparent;
		color: var(--ml-color-text-secondary);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		line-height: var(--ml-leading-tight);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-sidebar-item__link:hover:not(.ml-sidebar-item__link--disabled) {
		background-color: var(--ml-color-surface-secondary);
		color: var(--ml-color-text);
	}

	.ml-sidebar-item__link:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: -2px;
	}

	.ml-sidebar-item__link--active {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-sidebar-item__link--active:hover {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-sidebar-item__link--disabled {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-sidebar-item__link--collapsed {
		justify-content: center;
		padding: var(--ml-space-2);
	}

	/* Leading area (icon) */
	.ml-sidebar-item__leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		color: inherit;
	}

	/* Label */
	.ml-sidebar-item__label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:host([collapsed]) .ml-sidebar-item__label {
		display: none;
	}

	/* Trailing area */
	.ml-sidebar-item__trailing {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		flex-shrink: 0;
	}

	:host([collapsed]) .ml-sidebar-item__trailing {
		display: none;
	}

	/* Badge */
	.ml-sidebar-item__badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 var(--ml-space-1-5);
		border-radius: var(--ml-radius-full);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		line-height: 1;
		background-color: var(--ml-color-surface-tertiary);
		color: var(--ml-color-text-secondary);
	}

	.ml-sidebar-item__badge--primary {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-sidebar-item__badge--success {
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-color-success);
	}

	.ml-sidebar-item__badge--warning {
		background-color: var(--ml-color-warning-subtle);
		color: var(--ml-color-warning);
	}

	.ml-sidebar-item__badge--error {
		background-color: var(--ml-color-error-subtle);
		color: var(--ml-color-error);
	}

	/* Chevron for expandable items */
	.ml-sidebar-item__chevron {
		transition: transform var(--ml-duration-200) var(--ml-ease-in-out);
	}

	.ml-sidebar-item__link--expanded .ml-sidebar-item__chevron {
		transform: rotate(90deg);
	}

	/* Submenu */
	.ml-sidebar-item__submenu {
		overflow: hidden;
	}
`;
