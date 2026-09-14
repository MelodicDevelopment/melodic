import { css } from '@melodicdev/core';

export const alertStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Spacing
	 * --ml-alert-gap: var(--ml-space-3)
	 * --ml-alert-padding: var(--ml-space-4)
	 * --ml-alert-border-radius: var(--ml-radius-lg)
	 *
	 * Typography
	 * --ml-alert-title-font-weight: var(--ml-font-semibold)
	 * --ml-alert-title-font-size: var(--ml-text-sm)
	 * --ml-alert-title-margin-bottom: var(--ml-space-1)
	 * --ml-alert-message-font-size: var(--ml-text-sm)
	 * --ml-alert-message-line-height: var(--ml-leading-relaxed)
	 *
	 * Icon
	 * --ml-alert-icon-size: 1.25rem
	 *
	 * Dismiss button
	 * --ml-alert-dismiss-border-radius: var(--ml-radius-sm)
	 * --ml-alert-dismiss-opacity: 0.5
	 * --ml-alert-dismiss-hover-opacity: 1
	 *
	 * Transition
	 * --ml-alert-transition-duration: var(--ml-duration-150)
	 * --ml-alert-transition-easing: var(--ml-ease-in-out)
	 * --ml-alert-info-bg: var(--ml-color-info-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-info-border: var(--ml-color-info-border, var(--ml-color-border))
	 * --ml-alert-info-text: var(--ml-color-info-text, var(--ml-color-text))
	 * --ml-alert-info-icon: var(--ml-color-info, var(--ml-color-text-secondary))
	 * --ml-alert-success-bg: var(--ml-color-success-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-success-border: var(--ml-color-success-border, var(--ml-color-border))
	 * --ml-alert-success-text: var(--ml-color-success-text, var(--ml-color-text))
	 * --ml-alert-success-icon: var(--ml-color-success, var(--ml-color-text-secondary))
	 * --ml-alert-warning-bg: var(--ml-color-warning-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-warning-border: var(--ml-color-warning-border, var(--ml-color-border))
	 * --ml-alert-warning-text: var(--ml-color-warning-text, var(--ml-color-text))
	 * --ml-alert-warning-icon: var(--ml-color-warning, var(--ml-color-text-secondary))
	 * --ml-alert-error-bg: var(--ml-color-error-subtle, var(--ml-color-surface-secondary))
	 * --ml-alert-error-border: var(--ml-color-error-border, var(--ml-color-border))
	 * --ml-alert-error-text: var(--ml-color-error-text, var(--ml-color-text))
	 * --ml-alert-error-icon: var(--ml-color-error, var(--ml-color-text-secondary))
	 */

	:host {
		display: block;

		/* ── Alert: variants ──
		   Declared here so every property the rules reference has a value on
		   :host. Without these declarations the variant rules resolved against
		   nothing when the theme did not define them, and the alert rendered
		   transparent. */
	}

	:host([hidden]) {
		display: none;
	}

	.ml-alert {
		display: flex;
		gap: var(--ml-alert-gap, var(--ml-space-3));
		padding: var(--ml-alert-padding, var(--ml-space-4));
		border-radius: var(--ml-alert-border-radius, var(--ml-radius-lg));
		border: var(--ml-border) solid transparent;
	}

	.ml-alert--info {
		background-color: var(--ml-alert-info-bg, var(--ml-color-info-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-info-border, var(--ml-color-info-border, var(--ml-color-border)));
		color: var(--ml-alert-info-text, var(--ml-color-info-text, var(--ml-color-text)));
	}

	.ml-alert--info .ml-alert__icon {
		color: var(--ml-alert-info-icon, var(--ml-color-info, var(--ml-color-text-secondary)));
	}

	.ml-alert--success {
		background-color: var(--ml-alert-success-bg, var(--ml-color-success-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-success-border, var(--ml-color-success-border, var(--ml-color-border)));
		color: var(--ml-alert-success-text, var(--ml-color-success-text, var(--ml-color-text)));
	}

	.ml-alert--success .ml-alert__icon {
		color: var(--ml-alert-success-icon, var(--ml-color-success, var(--ml-color-text-secondary)));
	}

	.ml-alert--warning {
		background-color: var(--ml-alert-warning-bg, var(--ml-color-warning-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-warning-border, var(--ml-color-warning-border, var(--ml-color-border)));
		color: var(--ml-alert-warning-text, var(--ml-color-warning-text, var(--ml-color-text)));
	}

	.ml-alert--warning .ml-alert__icon {
		color: var(--ml-alert-warning-icon, var(--ml-color-warning, var(--ml-color-text-secondary)));
	}

	.ml-alert--error {
		background-color: var(--ml-alert-error-bg, var(--ml-color-error-subtle, var(--ml-color-surface-secondary)));
		border-color: var(--ml-alert-error-border, var(--ml-color-error-border, var(--ml-color-border)));
		color: var(--ml-alert-error-text, var(--ml-color-error-text, var(--ml-color-text)));
	}

	.ml-alert--error .ml-alert__icon {
		color: var(--ml-alert-error-icon, var(--ml-color-error, var(--ml-color-text-secondary)));
	}

	.ml-alert__icon {
		flex-shrink: 0;
		display: flex;
		align-items: flex-start;
		margin-top: -3px;
	}

	.ml-alert__icon ml-icon {
		font-size: var(--ml-alert-icon-size, 1.25rem);
	}

	.ml-alert__icon svg {
		width: var(--ml-alert-icon-size, 1.25rem);
		height: var(--ml-alert-icon-size, 1.25rem);
	}

	.ml-alert__content {
		flex: 1;
		min-width: 0;
	}

	.ml-alert__title {
		font-weight: var(--ml-alert-title-font-weight, var(--ml-font-semibold));
		font-size: var(--ml-alert-title-font-size, var(--ml-text-sm));
		margin-bottom: var(--ml-alert-title-margin-bottom, var(--ml-space-1));
	}

	.ml-alert__message {
		font-size: var(--ml-alert-message-font-size, var(--ml-text-sm));
		line-height: var(--ml-alert-message-line-height, var(--ml-leading-relaxed));
	}

	.ml-alert__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-alert-dismiss-border-radius, var(--ml-radius-sm));
		cursor: pointer;
		color: currentColor;
		opacity: var(--ml-alert-dismiss-opacity, 0.5);
		transition:
			opacity var(--ml-alert-transition-duration, var(--ml-duration-150)) var(--ml-alert-transition-easing, var(--ml-ease-in-out)),
			background-color var(--ml-alert-transition-duration, var(--ml-duration-150)) var(--ml-alert-transition-easing, var(--ml-ease-in-out));
	}

	.ml-alert__dismiss:hover {
		opacity: var(--ml-alert-dismiss-hover-opacity, 1);
	}

	.ml-alert__dismiss:focus-visible {
		outline: none;
		opacity: var(--ml-alert-dismiss-hover-opacity, 1);
	}
`;
