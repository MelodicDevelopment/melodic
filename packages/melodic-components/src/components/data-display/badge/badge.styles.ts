import { css } from '@melodicdev/core';

export const badgeStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1.5);
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-medium);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-radius);
	}

	/* Pill variant */
	.ml-badge--pill {
		border-radius: var(--ml-radius-full);
	}

	/* Sizes */
	.ml-badge--sm {
		padding: var(--ml-space-0.5) var(--ml-space-2);
		font-size: var(--ml-text-xs);
	}

	.ml-badge--md {
		padding: var(--ml-space-1) var(--ml-space-2.5);
		font-size: var(--ml-text-xs);
	}

	.ml-badge--lg {
		padding: var(--ml-space-1.5) var(--ml-space-3);
		font-size: var(--ml-text-sm);
	}

	/* Variants */
	.ml-badge--default {
		background-color: var(--ml-gray-100);
		color: var(--ml-gray-700);
	}

	.ml-badge--primary {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-blue-700);
	}

	.ml-badge--secondary {
		background-color: var(--ml-gray-100);
		color: var(--ml-gray-600);
	}

	.ml-badge--success {
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-green-700);
	}

	.ml-badge--warning {
		background-color: var(--ml-color-warning-subtle);
		color: var(--ml-amber-700);
	}

	.ml-badge--error {
		background-color: var(--ml-color-danger-subtle);
		color: var(--ml-red-700);
	}

	/* Dot indicator */
	.ml-badge__dot {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: var(--ml-radius-full);
		background-color: currentColor;
	}

	.ml-badge--lg .ml-badge__dot {
		width: 0.5rem;
		height: 0.5rem;
	}
`;
