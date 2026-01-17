import { css } from '@melodicdev/core';

export const buttonStyles = () => css`
	:host {
		display: inline-block;
	}

	:host([full-width]) {
		display: block;
		width: 100%;
	}

	.ml-button {
		/* Reset */
		appearance: none;
		border: none;
		background: none;
		cursor: pointer;
		text-decoration: none;

		/* Layout */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-space-2);
		position: relative;

		/* Typography */
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-medium);
		line-height: var(--ml-leading-none);
		white-space: nowrap;
		text-align: center;

		/* Borders */
		border: var(--ml-border) solid transparent;
		border-radius: var(--ml-radius-md);

		/* Transitions */
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out),
			opacity var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-button:focus {
		outline: none;
	}

	.ml-button:focus-visible {
		outline: var(--ml-focus-ring-width) solid var(--ml-color-focus-ring);
		outline-offset: var(--ml-focus-ring-offset);
	}

	/* ===== SIZES ===== */
	.ml-button--xs {
		height: 1.5rem;
		padding: 0 var(--ml-space-2);
		font-size: var(--ml-text-xs);
		border-radius: var(--ml-radius-sm);
	}

	.ml-button--sm {
		height: 2rem;
		padding: 0 var(--ml-space-3);
		font-size: var(--ml-text-sm);
		border-radius: var(--ml-radius);
	}

	.ml-button--md {
		height: 2.5rem;
		padding: 0 var(--ml-space-4);
		font-size: var(--ml-text-sm);
	}

	.ml-button--lg {
		height: 3rem;
		padding: 0 var(--ml-space-6);
		font-size: var(--ml-text-base);
		border-radius: var(--ml-radius-lg);
	}

	.ml-button--xl {
		height: 3.5rem;
		padding: 0 var(--ml-space-8);
		font-size: var(--ml-text-lg);
		border-radius: var(--ml-radius-lg);
	}

	/* ===== VARIANTS ===== */

	/* Primary */
	.ml-button--primary {
		background-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
	}

	.ml-button--primary:hover:not(:disabled) {
		background-color: var(--ml-color-primary-hover);
	}

	.ml-button--primary:active:not(:disabled) {
		background-color: var(--ml-color-primary-active);
	}

	/* Secondary */
	.ml-button--secondary {
		background-color: var(--ml-color-secondary);
		color: var(--ml-color-text-inverse);
	}

	.ml-button--secondary:hover:not(:disabled) {
		background-color: var(--ml-gray-700);
	}

	.ml-button--secondary:active:not(:disabled) {
		background-color: var(--ml-gray-800);
	}

	/* Outline */
	.ml-button--outline {
		background-color: transparent;
		border-color: var(--ml-color-border-strong);
		color: var(--ml-color-text);
	}

	.ml-button--outline:hover:not(:disabled) {
		background-color: var(--ml-color-surface-raised);
		border-color: var(--ml-color-primary);
		color: var(--ml-color-primary);
	}

	.ml-button--outline:active:not(:disabled) {
		background-color: var(--ml-color-primary-subtle);
	}

	/* Ghost */
	.ml-button--ghost {
		background-color: transparent;
		color: var(--ml-color-text);
	}

	.ml-button--ghost:hover:not(:disabled) {
		background-color: var(--ml-color-surface-raised);
	}

	.ml-button--ghost:active:not(:disabled) {
		background-color: var(--ml-color-surface-sunken);
	}

	/* Danger */
	.ml-button--danger {
		background-color: var(--ml-color-danger);
		color: var(--ml-color-text-inverse);
	}

	.ml-button--danger:hover:not(:disabled) {
		background-color: var(--ml-color-danger-hover);
	}

	.ml-button--danger:active:not(:disabled) {
		background-color: var(--ml-red-800);
	}

	/* Link */
	.ml-button--link {
		background-color: transparent;
		color: var(--ml-color-text-link);
		text-decoration: underline;
		padding: 0;
		height: auto;
	}

	.ml-button--link:hover:not(:disabled) {
		color: var(--ml-color-text-link-hover);
	}

	/* ===== STATES ===== */

	/* Disabled */
	.ml-button--disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Loading */
	.ml-button--loading .ml-button__content {
		visibility: hidden;
	}

	.ml-button__spinner {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Full width */
	.ml-button--full-width {
		width: 100%;
	}

	/* ===== CONTENT ===== */
	.ml-button__content {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-2);
	}

	/* Icon slots */
	::slotted([slot='icon-start']),
	::slotted([slot='icon-end']) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1em;
		height: 1em;
	}
`;
