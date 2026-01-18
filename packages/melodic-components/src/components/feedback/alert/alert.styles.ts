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

	.ml-alert--info {
		background-color: var(--ml-alert-info-bg);
		border-color: var(--ml-alert-info-border);
		color: var(--ml-alert-info-text);
	}

	.ml-alert--info .ml-alert__icon {
		color: var(--ml-alert-info-icon);
	}

	.ml-alert--success {
		background-color: var(--ml-alert-success-bg);
		border-color: var(--ml-alert-success-border);
		color: var(--ml-alert-success-text);
	}

	.ml-alert--success .ml-alert__icon {
		color: var(--ml-alert-success-icon);
	}

	.ml-alert--warning {
		background-color: var(--ml-alert-warning-bg);
		border-color: var(--ml-alert-warning-border);
		color: var(--ml-alert-warning-text);
	}

	.ml-alert--warning .ml-alert__icon {
		color: var(--ml-alert-warning-icon);
	}

	.ml-alert--error {
		background-color: var(--ml-alert-error-bg);
		border-color: var(--ml-alert-error-border);
		color: var(--ml-alert-error-text);
	}

	.ml-alert--error .ml-alert__icon {
		color: var(--ml-alert-error-icon);
	}

	.ml-alert__icon {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		margin-top: 0.125rem;
	}

	.ml-alert__icon svg {
		width: 100%;
		height: 100%;
	}

	.ml-alert__content {
		flex: 1;
		min-width: 0;
	}

	.ml-alert__title {
		font-weight: var(--ml-font-semibold);
		font-size: var(--ml-text-sm);
		margin-bottom: var(--ml-space-1);
	}

	.ml-alert__message {
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-relaxed);
	}

	.ml-alert__dismiss {
		flex-shrink: 0;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-radius-sm);
		cursor: pointer;
		color: currentColor;
		opacity: 0.5;
		transition:
			opacity var(--ml-duration-150) var(--ml-ease-in-out),
			background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-alert__dismiss:hover {
		opacity: 1;
	}

	.ml-alert__dismiss:focus-visible {
		outline: none;
		opacity: 1;
	}

	.ml-alert__dismiss svg {
		width: 100%;
		height: 100%;
	}
`;
