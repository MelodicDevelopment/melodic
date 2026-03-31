import { css } from '@melodicdev/core';

export const buttonStyles = () => css`
	:host {
		display: inline-block;

		/* --- Colors --- */
		--ml-button-bg: var(--ml-color-primary);
		--ml-button-border-color: var(--ml-color-primary);
		--ml-button-color: var(--ml-color-text-inverse);
		--ml-button-hover-bg: var(--ml-color-primary-hover);
		--ml-button-hover-border-color: var(--ml-color-primary-hover);
		--ml-button-hover-color: var(--ml-color-text-inverse);
		--ml-button-active-bg: var(--ml-color-primary-active);
		--ml-button-active-border-color: var(--ml-color-primary-active);
		--ml-button-shadow: var(--ml-shadow-xs);
		--ml-button-focus-shadow: var(--ml-shadow-focus-ring);

		/* --- Typography --- */
		--ml-button-font-family: var(--ml-font-sans);
		--ml-button-font-weight: var(--ml-font-semibold);
		--ml-button-font-size: var(--ml-text-sm);
		--ml-button-line-height: var(--ml-leading-tight);

		/* --- Spacing --- */
		--ml-button-height: 2.5rem;
		--ml-button-padding: 0 var(--ml-space-3-5);
		--ml-button-gap: var(--ml-space-2);
		--ml-button-border-width: var(--ml-border);
		--ml-button-border-radius: var(--ml-radius);

		/* --- Disabled --- */
		--ml-button-disabled-opacity: 0.5;

		/* --- Transition --- */
		--ml-button-transition-duration: var(--ml-duration-150);
		--ml-button-transition-easing: var(--ml-ease-in-out);
	}

	:host([full-width]) {
		display: block;
		width: 100%;
	}

	.ml-button {
		appearance: none;
		border: none;
		background: none;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-button-gap);
		position: relative;
		font-family: var(--ml-button-font-family);
		font-weight: var(--ml-button-font-weight);
		font-size: var(--ml-button-font-size);
		line-height: var(--ml-button-line-height);
		white-space: nowrap;
		text-align: center;
		height: var(--ml-button-height);
		padding: var(--ml-button-padding);
		border: var(--ml-button-border-width) solid var(--ml-button-border-color);
		border-radius: var(--ml-button-border-radius);
		background-color: var(--ml-button-bg);
		color: var(--ml-button-color);
		box-shadow: var(--ml-button-shadow);
		transition:
			background-color var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			border-color var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			color var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			box-shadow var(--ml-button-transition-duration) var(--ml-button-transition-easing),
			transform var(--ml-button-transition-duration) var(--ml-button-transition-easing);
	}

	.ml-button:focus {
		outline: none;
	}

	.ml-button:focus-visible {
		box-shadow: var(--ml-button-focus-shadow);
	}

	.ml-button:hover:not(:disabled) {
		background-color: var(--ml-button-hover-bg);
		border-color: var(--ml-button-hover-border-color);
		color: var(--ml-button-hover-color);
	}

	.ml-button:active:not(:disabled) {
		background-color: var(--ml-button-active-bg);
		border-color: var(--ml-button-active-border-color);
	}

	/* --- Size variants --- */
	.ml-button--xs {
		--ml-button-height: 2rem;
		--ml-button-padding: 0 var(--ml-space-3);
		--ml-button-font-size: var(--ml-text-xs);
		--ml-button-border-radius: var(--ml-radius-sm);
	}

	.ml-button--sm {
		--ml-button-height: 2.25rem;
		--ml-button-padding: 0 var(--ml-space-3);
		--ml-button-font-size: var(--ml-text-sm);
		--ml-button-border-radius: var(--ml-radius);
	}

	.ml-button--md {
		--ml-button-height: 2.5rem;
		--ml-button-padding: 0 var(--ml-space-3-5);
		--ml-button-font-size: var(--ml-text-sm);
	}

	.ml-button--lg {
		--ml-button-height: 2.75rem;
		--ml-button-padding: 0 var(--ml-space-4);
		--ml-button-font-size: var(--ml-text-sm);
	}

	.ml-button--xl {
		--ml-button-height: 3rem;
		--ml-button-padding: 0 var(--ml-space-5);
		--ml-button-font-size: var(--ml-text-base);
	}

	.ml-button--2xl {
		--ml-button-height: 3.75rem;
		--ml-button-padding: 0 var(--ml-space-7);
		--ml-button-font-size: var(--ml-text-lg);
		--ml-button-gap: var(--ml-space-3);
	}

	/* --- Variant: primary (default — already set on :host) --- */
	.ml-button--primary {
		--ml-button-bg: var(--ml-color-primary);
		--ml-button-border-color: var(--ml-color-primary);
		--ml-button-color: var(--ml-color-text-inverse);
		--ml-button-hover-bg: var(--ml-color-primary-hover);
		--ml-button-hover-border-color: var(--ml-color-primary-hover);
		--ml-button-active-bg: var(--ml-color-primary-active);
		--ml-button-active-border-color: var(--ml-color-primary-active);
	}

	/* --- Variant: secondary --- */
	.ml-button--secondary {
		--ml-button-bg: var(--ml-color-surface);
		--ml-button-border-color: var(--ml-color-border-strong);
		--ml-button-color: var(--ml-color-text-secondary);
		--ml-button-hover-bg: var(--ml-color-surface-raised);
		--ml-button-hover-border-color: var(--ml-color-border-strong);
		--ml-button-hover-color: var(--ml-color-text);
		--ml-button-active-bg: var(--ml-color-surface-sunken);
		--ml-button-focus-shadow: var(--ml-shadow-ring-gray);
	}

	/* --- Variant: outline --- */
	.ml-button--outline {
		--ml-button-bg: transparent;
		--ml-button-border-color: var(--ml-color-border-strong);
		--ml-button-color: var(--ml-color-text-secondary);
		--ml-button-shadow: none;
		--ml-button-hover-bg: var(--ml-color-surface-raised);
		--ml-button-hover-border-color: var(--ml-color-border-strong);
		--ml-button-hover-color: var(--ml-color-text);
		--ml-button-active-bg: var(--ml-color-surface-sunken);
	}

	/* --- Variant: ghost --- */
	.ml-button--ghost {
		--ml-button-bg: transparent;
		--ml-button-border-color: transparent;
		--ml-button-color: var(--ml-color-text-muted);
		--ml-button-shadow: none;
		--ml-button-hover-bg: var(--ml-color-surface-raised);
		--ml-button-hover-border-color: transparent;
		--ml-button-hover-color: var(--ml-color-text-secondary);
		--ml-button-active-bg: var(--ml-color-surface-sunken);
	}

	/* --- Variant: danger --- */
	.ml-button--danger {
		--ml-button-bg: var(--ml-color-danger);
		--ml-button-border-color: var(--ml-color-danger);
		--ml-button-color: var(--ml-color-text-inverse);
		--ml-button-hover-bg: var(--ml-color-danger-hover);
		--ml-button-hover-border-color: var(--ml-color-danger-hover);
		--ml-button-active-bg: var(--ml-red-800);
		--ml-button-active-border-color: var(--ml-red-800);
		--ml-button-focus-shadow: var(--ml-shadow-ring-error);
	}

	/* --- Variant: link --- */
	.ml-button--link {
		--ml-button-bg: transparent;
		--ml-button-border-color: transparent;
		--ml-button-color: var(--ml-color-text-link);
		--ml-button-shadow: none;
		--ml-button-font-weight: var(--ml-font-medium);
		--ml-button-height: auto;
		--ml-button-padding: 0;
		--ml-button-hover-bg: transparent;
		--ml-button-hover-border-color: transparent;
		--ml-button-hover-color: var(--ml-color-text-link-hover);
	}

	.ml-button--link:hover:not(:disabled) {
		text-decoration: underline;
	}

	/* --- Disabled --- */
	.ml-button--disabled {
		opacity: var(--ml-button-disabled-opacity);
		cursor: not-allowed;
		pointer-events: none;
		box-shadow: none;
	}

	.ml-button--loading .ml-button__content {
		visibility: hidden;
	}

	.ml-button--full-width {
		width: 100%;
	}

	.ml-button__spinner {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-button__content {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-button-gap);
	}

	::slotted([slot='icon-start']),
	::slotted([slot='icon-end']) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25em;
		height: 1.25em;
	}

	::slotted(ml-icon) {
		--ml-icon-size: 1.125em;
	}
`;
