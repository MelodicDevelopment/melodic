import { css } from '@melodicdev/core';

export const badgeStyles = () => css`
	:host {
		display: inline-block;
	}

	.ml-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-medium);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-radius-full);
		border: var(--ml-border) solid transparent;
	}

	.ml-badge--sm {
		padding: 2px var(--ml-space-2);
		font-size: var(--ml-text-xs);
	}

	.ml-badge--md {
		padding: var(--ml-space-1) var(--ml-space-3);
		font-size: var(--ml-text-xs);
	}

	.ml-badge--lg {
		padding: var(--ml-space-1) var(--ml-space-4);
		font-size: var(--ml-text-sm);
	}

	.ml-badge--lg .ml-badge__dot {
		width: 0.5rem;
		height: 0.5rem;
	}

	.ml-badge--default {
		background-color: var(--ml-badge-default-bg);
		border-color: var(--ml-badge-default-border);
		color: var(--ml-badge-default-text);
	}

	.ml-badge--primary {
		background-color: var(--ml-badge-primary-bg);
		border-color: var(--ml-badge-primary-border);
		color: var(--ml-badge-primary-text);
	}

	.ml-badge--secondary {
		background-color: var(--ml-badge-default-bg);
		border-color: var(--ml-badge-default-border);
		color: var(--ml-color-text-secondary);
	}

	.ml-badge--success {
		background-color: var(--ml-badge-success-bg);
		border-color: var(--ml-badge-success-border);
		color: var(--ml-badge-success-text);
	}

	.ml-badge--warning {
		background-color: var(--ml-badge-warning-bg);
		border-color: var(--ml-badge-warning-border);
		color: var(--ml-badge-warning-text);
	}

	.ml-badge--error {
		background-color: var(--ml-badge-error-bg);
		border-color: var(--ml-badge-error-border);
		color: var(--ml-badge-error-text);
	}

	.ml-badge__dot {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: var(--ml-radius-full);
		background-color: currentColor;
	}
`;
