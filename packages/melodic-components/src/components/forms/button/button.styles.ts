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
		appearance: none;
		border: none;
		background: none;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--ml-space-2);
		position: relative;
		font-family: var(--ml-font-sans);
		font-weight: var(--ml-font-semibold);
		line-height: var(--ml-leading-tight);
		white-space: nowrap;
		text-align: center;
		border: var(--ml-border) solid transparent;
		border-radius: var(--ml-radius);
		box-shadow: var(--ml-shadow-xs);
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			border-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out),
			box-shadow var(--ml-duration-150) var(--ml-ease-in-out),
			transform var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-button:focus {
		outline: none;
	}

	.ml-button:focus-visible {
		box-shadow: var(--ml-shadow-focus-ring);
	}

	.ml-button--xs {
		height: 2rem;
		padding: 0 var(--ml-space-3);
		font-size: var(--ml-text-xs);
		border-radius: var(--ml-radius-sm);
	}

	.ml-button--sm {
		height: 2.25rem;
		padding: 0 var(--ml-space-3);
		font-size: var(--ml-text-sm);
		border-radius: var(--ml-radius);
	}

	.ml-button--md {
		height: 2.5rem;
		padding: 0 var(--ml-space-3-5);
		font-size: var(--ml-text-sm);
	}

	.ml-button--lg {
		height: 2.75rem;
		padding: 0 var(--ml-space-4);
		font-size: var(--ml-text-sm);
	}

	.ml-button--xl {
		height: 3rem;
		padding: 0 var(--ml-space-5);
		font-size: var(--ml-text-base);
	}

	.ml-button--2xl {
		height: 3.75rem;
		padding: 0 var(--ml-space-7);
		font-size: var(--ml-text-lg);
		gap: var(--ml-space-3);
	}

	.ml-button--primary {
		background-color: var(--ml-color-primary);
		border-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
	}

	.ml-button--primary:hover:not(:disabled) {
		background-color: var(--ml-color-primary-hover);
		border-color: var(--ml-color-primary-hover);
	}

	.ml-button--primary:active:not(:disabled) {
		background-color: var(--ml-color-primary-active);
		border-color: var(--ml-color-primary-active);
	}

	.ml-button--secondary {
		background-color: var(--ml-color-surface);
		border-color: var(--ml-color-border-strong);
		color: var(--ml-color-text-secondary);
	}

	.ml-button--secondary:hover:not(:disabled) {
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text);
	}

	.ml-button--secondary:active:not(:disabled) {
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-button--secondary:focus-visible {
		box-shadow: var(--ml-shadow-ring-gray);
	}

	.ml-button--outline {
		background-color: transparent;
		border-color: var(--ml-color-border-strong);
		color: var(--ml-color-text-secondary);
		box-shadow: none;
	}

	.ml-button--outline:hover:not(:disabled) {
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text);
	}

	.ml-button--outline:active:not(:disabled) {
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-button--ghost {
		background-color: transparent;
		border-color: transparent;
		color: var(--ml-color-text-muted);
		box-shadow: none;
	}

	.ml-button--ghost:hover:not(:disabled) {
		background-color: var(--ml-color-surface-raised);
		color: var(--ml-color-text-secondary);
	}

	.ml-button--ghost:active:not(:disabled) {
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-button--danger {
		background-color: var(--ml-color-danger);
		border-color: var(--ml-color-danger);
		color: var(--ml-color-text-inverse);
	}

	.ml-button--danger:hover:not(:disabled) {
		background-color: var(--ml-color-danger-hover);
		border-color: var(--ml-color-danger-hover);
	}

	.ml-button--danger:active:not(:disabled) {
		background-color: var(--ml-red-800);
		border-color: var(--ml-red-800);
	}

	.ml-button--danger:focus-visible {
		box-shadow: var(--ml-shadow-ring-error);
	}

	.ml-button--link {
		background-color: transparent;
		border-color: transparent;
		color: var(--ml-color-text-link);
		padding: 0;
		height: auto;
		box-shadow: none;
		font-weight: var(--ml-font-medium);
	}

	.ml-button--link:hover:not(:disabled) {
		color: var(--ml-color-text-link-hover);
		text-decoration: underline;
	}

	.ml-button--disabled {
		opacity: 0.5;
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
		gap: var(--ml-space-2);
	}

	::slotted([slot='icon-start']),
	::slotted([slot='icon-end']) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25em;
		height: 1.25em;
	}
`;
