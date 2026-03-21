import { css } from '@melodicdev/core';

export const sidebarItemStyles = () => css`
	:host {
		/* Item link */
		--ml-sidebar-item-gap: var(--ml-space-3);
		--ml-sidebar-item-padding-y: var(--ml-space-2);
		--ml-sidebar-item-padding-x: var(--ml-space-3);
		--ml-sidebar-item-radius: var(--ml-radius);
		--ml-sidebar-item-color: var(--ml-color-text-secondary);
		--ml-sidebar-item-font-family: var(--ml-font-sans);
		--ml-sidebar-item-font-size: var(--ml-text-sm);
		--ml-sidebar-item-font-weight: var(--ml-font-medium);
		--ml-sidebar-item-line-height: var(--ml-leading-tight);
		--ml-sidebar-item-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Item hover */
		--ml-sidebar-item-hover-bg: var(--ml-gray-100);
		--ml-sidebar-item-hover-color: var(--ml-color-text);

		/* Item focus */
		--ml-sidebar-item-focus-color: var(--ml-color-primary);

		/* Item active */
		--ml-sidebar-item-active-bg: var(--ml-color-primary);
		--ml-sidebar-item-active-color: var(--ml-color-text-inverse);
		--ml-sidebar-item-active-hover-bg: var(--ml-color-primary-hover);

		/* Item disabled */
		--ml-sidebar-item-disabled-color: var(--ml-color-text-muted);
		--ml-sidebar-item-disabled-opacity: 0.6;

		/* Item icon size */
		--ml-sidebar-item-icon-size: 20px;

		/* Item trailing gap */
		--ml-sidebar-item-trailing-gap: var(--ml-space-2);

		/* Badge */
		--ml-sidebar-item-badge-min-size: 20px;
		--ml-sidebar-item-badge-padding-x: var(--ml-space-1-5);
		--ml-sidebar-item-badge-radius: var(--ml-radius-full);
		--ml-sidebar-item-badge-font-size: var(--ml-text-xs);
		--ml-sidebar-item-badge-font-weight: var(--ml-font-medium);
		--ml-sidebar-item-badge-bg: var(--ml-color-surface-tertiary);
		--ml-sidebar-item-badge-color: var(--ml-color-text-secondary);

		/* Chevron transition */
		--ml-sidebar-item-chevron-transition: var(--ml-duration-200) var(--ml-ease-in-out);

		display: block;
	}

	.ml-sidebar-item {
		--level: 0;
	}

	.ml-sidebar-item__link {
		display: flex;
		align-items: center;
		gap: var(--ml-sidebar-item-gap);
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-sidebar-item-padding-y) var(--ml-sidebar-item-padding-x);
		padding-left: calc(var(--ml-sidebar-item-padding-x) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-radius: var(--ml-sidebar-item-radius);
		background: transparent;
		color: var(--ml-sidebar-item-color);
		font-family: var(--ml-sidebar-item-font-family);
		font-size: var(--ml-sidebar-item-font-size);
		font-weight: var(--ml-sidebar-item-font-weight);
		line-height: var(--ml-sidebar-item-line-height);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-sidebar-item-transition),
			color var(--ml-sidebar-item-transition);
	}

	.ml-sidebar-item__link:hover:not(.ml-sidebar-item__link--disabled):not(.ml-sidebar-item__link--active) {
		background-color: var(--ml-sidebar-item-hover-bg);
		color: var(--ml-sidebar-item-hover-color);
	}

	.ml-sidebar-item__link:focus-visible {
		outline: 2px solid var(--ml-sidebar-item-focus-color);
		outline-offset: -2px;
	}

	.ml-sidebar-item__link--active {
		background-color: var(--ml-sidebar-item-active-bg);
		color: var(--ml-sidebar-item-active-color);
	}

	.ml-sidebar-item__link--active:hover {
		background-color: var(--ml-sidebar-item-active-hover-bg);
		color: var(--ml-sidebar-item-active-color);
	}

	.ml-sidebar-item__link--disabled {
		color: var(--ml-sidebar-item-disabled-color);
		cursor: not-allowed;
		opacity: var(--ml-sidebar-item-disabled-opacity);
	}

	.ml-sidebar-item__link--collapsed {
		justify-content: center;
		padding: var(--ml-sidebar-item-padding-y);
	}

	/* Leading area (icon) */
	.ml-sidebar-item__leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-sidebar-item-icon-size);
		height: var(--ml-sidebar-item-icon-size);
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
		gap: var(--ml-sidebar-item-trailing-gap);
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
		min-width: var(--ml-sidebar-item-badge-min-size);
		height: var(--ml-sidebar-item-badge-min-size);
		padding: 0 var(--ml-sidebar-item-badge-padding-x);
		border-radius: var(--ml-sidebar-item-badge-radius);
		font-size: var(--ml-sidebar-item-badge-font-size);
		font-weight: var(--ml-sidebar-item-badge-font-weight);
		line-height: 1;
		background-color: var(--ml-sidebar-item-badge-bg);
		color: var(--ml-sidebar-item-badge-color);
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
		transition: transform var(--ml-sidebar-item-chevron-transition);
	}

	.ml-sidebar-item__link--expanded .ml-sidebar-item__chevron {
		transform: rotate(90deg);
	}

	/* Submenu */
	.ml-sidebar-item__submenu {
		overflow: hidden;
	}
`;
