import { css } from '@melodicdev/core';

export const alertStyles = () => css`
	:host {
		display: block;
	}

	:host([hidden]) {
		display: none;
	}

	.ml-alert {
		display: flex;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4);
		border-radius: var(--ml-radius-lg);
		border: var(--ml-border) solid transparent;
	}

	/* Variants */
	.ml-alert--info {
		background-color: var(--ml-color-info-subtle);
		border-color: var(--ml-cyan-200);
		color: var(--ml-cyan-800);
	}

	.ml-alert--info .ml-alert__icon {
		color: var(--ml-color-info);
	}

	.ml-alert--success {
		background-color: var(--ml-color-success-subtle);
		border-color: var(--ml-green-200);
		color: var(--ml-green-800);
	}

	.ml-alert--success .ml-alert__icon {
		color: var(--ml-color-success);
	}

	.ml-alert--warning {
		background-color: var(--ml-color-warning-subtle);
		border-color: var(--ml-amber-200);
		color: var(--ml-amber-800);
	}

	.ml-alert--warning .ml-alert__icon {
		color: var(--ml-color-warning);
	}

	.ml-alert--error {
		background-color: var(--ml-color-danger-subtle);
		border-color: var(--ml-red-200);
		color: var(--ml-red-800);
	}

	.ml-alert--error .ml-alert__icon {
		color: var(--ml-color-danger);
	}

	/* Icon */
	.ml-alert__icon {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
	}

	.ml-alert__icon svg {
		width: 100%;
		height: 100%;
	}

	/* Content */
	.ml-alert__content {
		flex: 1;
		min-width: 0;
	}

	.ml-alert__title {
		font-weight: var(--ml-font-semibold);
		margin-bottom: var(--ml-space-1);
	}

	.ml-alert__message {
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-relaxed);
	}

	/* Dismiss button */
	.ml-alert__dismiss {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.6;
		transition: opacity var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-alert__dismiss:hover {
		opacity: 1;
	}

	.ml-alert__dismiss svg {
		width: 100%;
		height: 100%;
	}
`;
