import { css } from '@melodicdev/core';

export const badgeStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * --ml-badge-background: var(--ml-badge-default-bg)
	 * --ml-badge-border-color: var(--ml-badge-default-border)
	 * --ml-badge-text: var(--ml-badge-default-text)
	 *
	 * Badge: typography
	 * --ml-badge-font: var(--ml-font-sans)
	 * --ml-badge-font-weight: var(--ml-font-medium)
	 * --ml-badge-font-size: var(--ml-text-xs)
	 *
	 * Badge: spacing / shape
	 * --ml-badge-gap: var(--ml-space-1-5)
	 * --ml-badge-padding: var(--ml-space-1) var(--ml-space-3)
	 * --ml-badge-radius: var(--ml-radius-md)
	 * --ml-badge-border-width: var(--ml-border)
	 *
	 * Badge: pill shape
	 * --ml-badge-pill-radius: var(--ml-radius-full)
	 *
	 * Badge: dot
	 * --ml-badge-dot-size: 0.375rem
	 * --ml-badge-dot-size-xs: 0.3125rem
	 * --ml-badge-dot-size-lg: 0.5rem
	 * --ml-badge-dot-radius: var(--ml-radius-full)
	 *
	 * Badge: secondary variant
	 * --ml-badge-secondary-color: var(--ml-color-text-secondary)
	 *
	 * Badge: custom variant (consumer API: --ml-badge-bg / --ml-badge-color)
	 * --ml-badge-custom-color: var(--ml-badge-color, #fff)
	 */

	:host {
		display: inline-block;

		/* ── Badge: colors (default variant; variant classes reassign) ──
		   --ml-badge-background     - background color
		   --ml-badge-border-color   - border color
		   --ml-badge-text           - text color */
	}

	.ml-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-badge-gap, var(--ml-space-1-5));
		padding: var(--ml-badge-padding, var(--ml-space-1) var(--ml-space-3));
		font-family: var(--ml-badge-font, var(--ml-font-sans));
		font-size: var(--ml-badge-font-size, var(--ml-text-xs));
		font-weight: var(--ml-badge-font-weight, var(--ml-font-medium));
		line-height: 1;
		white-space: nowrap;
		color: var(--ml-badge-text, var(--ml-badge-default-text));
		background-color: var(--ml-badge-background, var(--ml-badge-default-bg));
		border-radius: var(--ml-badge-radius, var(--ml-radius-md));
		border: var(--ml-badge-border-width, var(--ml-border)) solid var(--ml-badge-border-color, var(--ml-badge-default-border));
	}

	.ml-badge--pill {
		border-radius: var(--ml-badge-pill-radius, var(--ml-radius-full));
	}

	.ml-badge__dot {
		width: var(--ml-badge-dot-size, 0.375rem);
		height: var(--ml-badge-dot-size, 0.375rem);
		border-radius: var(--ml-badge-dot-radius, var(--ml-radius-full));
		background-color: currentColor;
	}

	.ml-badge--lg .ml-badge__dot {
		width: var(--ml-badge-dot-size-lg, 0.5rem);
		height: var(--ml-badge-dot-size-lg, 0.5rem);
	}

	.ml-badge--xs .ml-badge__dot {
		width: var(--ml-badge-dot-size-xs, 0.3125rem);
		height: var(--ml-badge-dot-size-xs, 0.3125rem);
	}

	/* ── Size variants: reassign base spacing/typography properties ── */
	.ml-badge--xs {
		--ml-badge-padding: 1px var(--ml-space-1-5);
		--ml-badge-font-size: 0.6875rem;
	}

	.ml-badge--sm {
		--ml-badge-padding: 2px var(--ml-space-2);
		--ml-badge-font-size: var(--ml-text-xs);
	}

	.ml-badge--md {
		--ml-badge-padding: var(--ml-space-1) var(--ml-space-3);
		--ml-badge-font-size: var(--ml-text-xs);
	}

	.ml-badge--lg {
		--ml-badge-padding: var(--ml-space-1) var(--ml-space-4);
		--ml-badge-font-size: var(--ml-text-sm);
	}

	/* ── Color variants: reassign base color properties ── */
	.ml-badge--default {
		--ml-badge-background: var(--ml-badge-default-bg);
		--ml-badge-border-color: var(--ml-badge-default-border);
		--ml-badge-text: var(--ml-badge-default-text);
	}

	.ml-badge--primary {
		--ml-badge-background: var(--ml-badge-primary-bg);
		--ml-badge-border-color: var(--ml-badge-primary-border);
		--ml-badge-text: var(--ml-badge-primary-text);
	}

	.ml-badge--secondary {
		--ml-badge-background: var(--ml-badge-default-bg);
		--ml-badge-border-color: var(--ml-badge-default-border);
		--ml-badge-text: var(--ml-badge-secondary-color, var(--ml-color-text-secondary));
	}

	.ml-badge--success {
		--ml-badge-background: var(--ml-badge-success-bg);
		--ml-badge-border-color: var(--ml-badge-success-border);
		--ml-badge-text: var(--ml-badge-success-text);
	}

	.ml-badge--warning {
		--ml-badge-background: var(--ml-badge-warning-bg);
		--ml-badge-border-color: var(--ml-badge-warning-border);
		--ml-badge-text: var(--ml-badge-warning-text);
	}

	.ml-badge--error {
		--ml-badge-background: var(--ml-badge-error-bg);
		--ml-badge-border-color: var(--ml-badge-error-border);
		--ml-badge-text: var(--ml-badge-error-text);
	}

	/* Custom variant keeps its documented consumer API: set --ml-badge-bg and
	   optionally --ml-badge-color on the host. */
	.ml-badge--custom {
		--ml-badge-background: var(--ml-badge-bg, transparent);
		--ml-badge-border-color: transparent;
		--ml-badge-text: var(--ml-badge-custom-color, var(--ml-badge-color, #fff));
	}
`;
