import { css } from '@melodicdev/core';

export const paginationStyles = () => css`
	:host {
		/* Layout */
		--ml-pagination-gap: var(--ml-space-3);
		--ml-pagination-pages-gap: var(--ml-space-1);

		/* Button base */
		--ml-pagination-btn-padding-y: var(--ml-space-2);
		--ml-pagination-btn-padding-x: var(--ml-space-3);
		--ml-pagination-btn-font-size: var(--ml-text-sm);
		--ml-pagination-btn-font-weight: var(--ml-font-medium);
		--ml-pagination-btn-color: var(--ml-color-text-secondary);
		--ml-pagination-btn-bg: transparent;
		--ml-pagination-btn-radius: var(--ml-radius-md);
		--ml-pagination-btn-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Button hover */
		--ml-pagination-btn-hover-bg: var(--ml-color-surface-hover);
		--ml-pagination-btn-hover-color: var(--ml-color-text);

		/* Button page size */
		--ml-pagination-btn-page-size: 40px;

		/* Nav button */
		--ml-pagination-nav-font-weight: var(--ml-font-semibold);

		/* Active state */
		--ml-pagination-active-bg: var(--ml-color-primary);
		--ml-pagination-active-color: var(--ml-color-text-inverse);
		--ml-pagination-active-font-weight: var(--ml-font-semibold);

		/* Disabled state */
		--ml-pagination-disabled-opacity: 0.5;

		/* Ellipsis */
		--ml-pagination-ellipsis-font-size: var(--ml-text-sm);
		--ml-pagination-ellipsis-color: var(--ml-color-text-tertiary);

		display: block;
	}

	.ml-pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-pagination-gap);
	}

	.ml-pagination__pages {
		display: flex;
		align-items: center;
		gap: var(--ml-pagination-pages-gap);
	}

	.ml-pagination__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-space-2);
		padding: var(--ml-pagination-btn-padding-y) var(--ml-pagination-btn-padding-x);
		font-size: var(--ml-pagination-btn-font-size);
		font-weight: var(--ml-pagination-btn-font-weight);
		color: var(--ml-pagination-btn-color);
		background: var(--ml-pagination-btn-bg);
		border: none;
		border-radius: var(--ml-pagination-btn-radius);
		cursor: pointer;
		user-select: none;
		transition:
			background-color var(--ml-pagination-btn-transition),
			color var(--ml-pagination-btn-transition);
	}

	.ml-pagination__btn:hover:not(:disabled) {
		background-color: var(--ml-pagination-btn-hover-bg);
		color: var(--ml-pagination-btn-hover-color);
	}

	.ml-pagination__btn--nav {
		font-weight: var(--ml-pagination-nav-font-weight);
	}

	.ml-pagination__btn--page {
		min-width: var(--ml-pagination-btn-page-size);
		height: var(--ml-pagination-btn-page-size);
		padding: 0;
	}

	.ml-pagination__btn--active,
	.ml-pagination__btn--active:hover {
		background-color: var(--ml-pagination-active-bg);
		color: var(--ml-pagination-active-color);
		font-weight: var(--ml-pagination-active-font-weight);
	}

	.ml-pagination__btn--disabled,
	.ml-pagination__btn:disabled {
		opacity: var(--ml-pagination-disabled-opacity);
		cursor: not-allowed;
	}

	.ml-pagination__ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-pagination-btn-page-size);
		height: var(--ml-pagination-btn-page-size);
		font-size: var(--ml-pagination-ellipsis-font-size);
		color: var(--ml-pagination-ellipsis-color);
	}
`;
