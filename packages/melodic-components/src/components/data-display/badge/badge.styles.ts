import { css } from '@melodicdev/core';

export const badgeStyles = () => css`
	:host {
		display: inline-block;

		/* ── Badge: base ── */
		--ml-badge-font: var(--ml-font-sans);
		--ml-badge-font-weight: var(--ml-font-medium);
		--ml-badge-radius: var(--ml-radius-md);
		--ml-badge-border-width: var(--ml-border);

		/* ── Badge: pill shape ── */
		--ml-badge-pill-radius: var(--ml-radius-full);

		/* ── Badge: dot ── */
		--ml-badge-dot-size: 0.375rem;
		--ml-badge-dot-size-xs: 0.3125rem;
		--ml-badge-dot-size-lg: 0.5rem;

		/* ── Badge: secondary variant ── */
		--ml-badge-secondary-color: var(--ml-color-text-secondary);

		/* ── Badge: custom variant ── */
		--ml-badge-custom-color: var(--ml-badge-color, #fff);
	}

	.ml-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1-5);
		font-family: var(--ml-badge-font);
		font-weight: var(--ml-badge-font-weight);
		line-height: 1;
		white-space: nowrap;
		border-radius: var(--ml-badge-radius);
		border: var(--ml-badge-border-width) solid transparent;
	}

	.ml-badge--pill {
		border-radius: var(--ml-badge-pill-radius);
	}

	.ml-badge__dot {
		width: var(--ml-badge-dot-size);
		height: var(--ml-badge-dot-size);
		border-radius: var(--ml-radius-full);
		background-color: currentColor;
	}

	.ml-badge--lg .ml-badge__dot {
		width: var(--ml-badge-dot-size-lg);
		height: var(--ml-badge-dot-size-lg);
	}

	.ml-badge--xs .ml-badge__dot {
		width: var(--ml-badge-dot-size-xs);
		height: var(--ml-badge-dot-size-xs);
	}

	.ml-badge--xs {
		padding: 1px var(--ml-space-1-5);
		font-size: 0.6875rem;
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
		color: var(--ml-badge-secondary-color);
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

	.ml-badge--custom {
		background-color: var(--ml-badge-bg);
		border-color: transparent;
		color: var(--ml-badge-custom-color);
	}

`;
