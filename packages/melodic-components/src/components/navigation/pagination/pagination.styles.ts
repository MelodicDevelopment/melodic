import { css } from '@melodicdev/core';

export const paginationStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Pagination: focus
	 * --ml-pagination-focus-width: 2px
	 * --ml-pagination-focus-color: var(--ml-color-primary)
	 * --ml-pagination-focus-offset: 2px
	 *
	 * Layout
	 * --ml-pagination-gap: var(--ml-space-3)
	 * --ml-pagination-pages-gap: var(--ml-space-1)
	 *
	 * Button base
	 * --ml-pagination-btn-gap: var(--ml-space-2)
	 * --ml-pagination-btn-padding-y: var(--ml-space-2)
	 * --ml-pagination-btn-padding-x: var(--ml-space-3)
	 * --ml-pagination-btn-font-size: var(--ml-text-sm)
	 * --ml-pagination-btn-font-weight: var(--ml-font-medium)
	 * --ml-pagination-btn-color: var(--ml-color-text-secondary)
	 * --ml-pagination-btn-bg: transparent
	 * --ml-pagination-btn-radius: var(--ml-radius-md)
	 * --ml-pagination-btn-transition-duration: var(--ml-duration-150)
	 * --ml-pagination-btn-transition-easing: var(--ml-ease-in-out)
	 *
	 * Button hover
	 * --ml-pagination-btn-hover-bg: var(--ml-color-surface-hover)
	 * --ml-pagination-btn-hover-color: var(--ml-color-text)
	 *
	 * Button page size
	 * --ml-pagination-btn-page-size: 40px
	 *
	 * Nav button
	 * --ml-pagination-nav-font-weight: var(--ml-font-semibold)
	 *
	 * Active state
	 * --ml-pagination-active-bg: var(--ml-color-primary)
	 * --ml-pagination-active-color: var(--ml-color-text-inverse)
	 * --ml-pagination-active-font-weight: var(--ml-font-semibold)
	 *
	 * Disabled state
	 * --ml-pagination-disabled-opacity: 0.5
	 *
	 * Ellipsis
	 * --ml-pagination-ellipsis-font-size: var(--ml-text-sm)
	 * --ml-pagination-ellipsis-color: var(--ml-color-text-tertiary)
	 */

	:host {
		display: block;
	}

	.ml-pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-pagination-gap, var(--ml-space-3));
	}

	.ml-pagination__pages {
		display: flex;
		align-items: center;
		gap: var(--ml-pagination-pages-gap, var(--ml-space-1));
	}

	.ml-pagination__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-pagination-btn-gap, var(--ml-space-2));
		padding: var(--ml-pagination-btn-padding-y, var(--ml-space-2)) var(--ml-pagination-btn-padding-x, var(--ml-space-3));
		font-size: var(--ml-pagination-btn-font-size, var(--ml-text-sm));
		font-weight: var(--ml-pagination-btn-font-weight, var(--ml-font-medium));
		color: var(--ml-pagination-btn-color, var(--ml-color-text-secondary));
		background: var(--ml-pagination-btn-bg, transparent);
		border: none;
		border-radius: var(--ml-pagination-btn-radius, var(--ml-radius-md));
		cursor: pointer;
		user-select: none;
		transition:
			background-color var(--ml-pagination-btn-transition-duration, var(--ml-duration-150)) var(--ml-pagination-btn-transition-easing, var(--ml-ease-in-out)),
			color var(--ml-pagination-btn-transition-duration, var(--ml-duration-150)) var(--ml-pagination-btn-transition-easing, var(--ml-ease-in-out));
	}

	.ml-pagination__btn:hover:not(:disabled) {
		background-color: var(--ml-pagination-btn-hover-bg, var(--ml-color-surface-hover));
		color: var(--ml-pagination-btn-hover-color, var(--ml-color-text));
	}

	.ml-pagination__btn:focus-visible {
		outline: var(--ml-pagination-focus-width, 2px) solid var(--ml-pagination-focus-color, var(--ml-color-primary));
		outline-offset: var(--ml-pagination-focus-offset, 2px);
	}

	.ml-pagination__btn--nav {
		font-weight: var(--ml-pagination-nav-font-weight, var(--ml-font-semibold));
	}

	.ml-pagination__btn--page {
		min-width: var(--ml-pagination-btn-page-size, 40px);
		height: var(--ml-pagination-btn-page-size, 40px);
		padding: 0;
	}

	.ml-pagination__btn--active,
	.ml-pagination__btn--active:hover {
		background-color: var(--ml-pagination-active-bg, var(--ml-color-primary));
		color: var(--ml-pagination-active-color, var(--ml-color-text-inverse));
		font-weight: var(--ml-pagination-active-font-weight, var(--ml-font-semibold));
	}

	.ml-pagination__btn--disabled,
	.ml-pagination__btn:disabled {
		opacity: var(--ml-pagination-disabled-opacity, 0.5);
		cursor: not-allowed;
	}

	.ml-pagination__ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-pagination-btn-page-size, 40px);
		height: var(--ml-pagination-btn-page-size, 40px);
		font-size: var(--ml-pagination-ellipsis-font-size, var(--ml-text-sm));
		color: var(--ml-pagination-ellipsis-color, var(--ml-color-text-tertiary));
	}
`;
