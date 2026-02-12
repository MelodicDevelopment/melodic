import { css } from '@melodicdev/core';

export const breadcrumbItemStyles = () => css`
	:host {
		display: contents;
	}

	.ml-breadcrumb-item {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-breadcrumb-item__separator {
		display: flex;
		align-items: center;
		color: var(--ml-color-text-tertiary);
	}

	/* Hide separator on first item */
	:host(:first-child) .ml-breadcrumb-item__separator {
		display: none;
	}

	.ml-breadcrumb-item__link {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		text-decoration: none;
		border-radius: var(--ml-radius-sm);
		padding: var(--ml-space-1) var(--ml-space-1);
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-breadcrumb-item__link:hover {
		color: var(--ml-color-text);
	}

	.ml-breadcrumb-item__text {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-secondary);
		padding: var(--ml-space-1) var(--ml-space-1);
	}

	.ml-breadcrumb-item--current .ml-breadcrumb-item__text {
		color: var(--ml-color-text);
		font-weight: var(--ml-font-semibold);
	}
`;
