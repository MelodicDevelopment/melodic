import { css } from '@melodicdev/core';

export const paginationStyles = () => css`
	:host {
		display: block;
	}

	.ml-pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-3);
	}

	.ml-pagination__pages {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-pagination__btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-space-2);
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		background: none;
		border: none;
		border-radius: var(--ml-radius-md);
		cursor: pointer;
		user-select: none;
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-pagination__btn:hover:not(:disabled) {
		background-color: var(--ml-color-surface-hover);
		color: var(--ml-color-text);
	}

	.ml-pagination__btn--nav {
		font-weight: var(--ml-font-semibold);
	}

	.ml-pagination__btn--page {
		min-width: 40px;
		height: 40px;
		padding: 0;
	}

	.ml-pagination__btn--active,
	.ml-pagination__btn--active:hover {
		background-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
		font-weight: var(--ml-font-semibold);
	}

	.ml-pagination__btn--disabled,
	.ml-pagination__btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ml-pagination__ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 40px;
		height: 40px;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-tertiary);
	}
`;
