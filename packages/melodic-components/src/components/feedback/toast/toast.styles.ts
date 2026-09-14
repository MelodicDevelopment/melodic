import { css } from '@melodicdev/core';

export const toastStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Background & border
	 * --ml-toast-bg: var(--ml-color-surface)
	 * --ml-toast-border-color: var(--ml-color-border)
	 * --ml-toast-border-radius: var(--ml-radius-lg)
	 * --ml-toast-shadow: var(--ml-shadow-lg)
	 *
	 * Spacing
	 * --ml-toast-gap: var(--ml-space-3)
	 * --ml-toast-padding: var(--ml-space-4)
	 * --ml-toast-min-width: 320px
	 * --ml-toast-max-width: 420px
	 *
	 * Title
	 * --ml-toast-title-font-size: var(--ml-text-sm)
	 * --ml-toast-title-font-weight: var(--ml-font-semibold)
	 * --ml-toast-title-color: var(--ml-color-text)
	 * --ml-toast-title-line-height: var(--ml-leading-tight)
	 *
	 * Message
	 * --ml-toast-message-font-size: var(--ml-text-sm)
	 * --ml-toast-message-color: var(--ml-color-text-secondary)
	 * --ml-toast-message-line-height: var(--ml-leading-relaxed)
	 * --ml-toast-message-margin-top: var(--ml-space-1)
	 *
	 * Icon variant colors
	 * --ml-toast-info-icon-color: var(--ml-color-primary)
	 * --ml-toast-success-icon-color: var(--ml-color-success)
	 * --ml-toast-warning-icon-color: var(--ml-color-warning)
	 * --ml-toast-error-icon-color: var(--ml-color-danger)
	 *
	 * Dismiss button
	 * --ml-toast-dismiss-border-radius: var(--ml-radius-sm)
	 * --ml-toast-dismiss-color: var(--ml-color-text-tertiary)
	 * --ml-toast-dismiss-hover-color: var(--ml-color-text)
	 *
	 * Transition
	 * --ml-toast-transition-duration: var(--ml-duration-150)
	 * --ml-toast-transition-easing: var(--ml-ease-in-out)
	 *
	 * Animation
	 * --ml-toast-animation-duration: var(--ml-duration-300)
	 * --ml-toast-animation-easing: var(--ml-ease-out)
	 */

	:host {
		display: block;
	}

	.ml-toast {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-toast-gap, var(--ml-space-3));
		padding: var(--ml-toast-padding, var(--ml-space-4));
		background-color: var(--ml-toast-bg, var(--ml-color-surface));
		border: 1px solid var(--ml-toast-border-color, var(--ml-color-border));
		border-radius: var(--ml-toast-border-radius, var(--ml-radius-lg));
		box-shadow: var(--ml-toast-shadow, var(--ml-shadow-lg));
		min-width: var(--ml-toast-min-width, 320px);
		max-width: var(--ml-toast-max-width, 420px);
		animation: ml-toast-in var(--ml-toast-animation-duration, var(--ml-duration-300)) var(--ml-toast-animation-easing, var(--ml-ease-out));
	}

	@keyframes ml-toast-in {
		from {
			opacity: 0;
			transform: translateY(-8px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.ml-toast__icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.ml-toast--info .ml-toast__icon {
		color: var(--ml-toast-info-icon-color, var(--ml-color-primary));
	}

	.ml-toast--success .ml-toast__icon {
		color: var(--ml-toast-success-icon-color, var(--ml-color-success));
	}

	.ml-toast--warning .ml-toast__icon {
		color: var(--ml-toast-warning-icon-color, var(--ml-color-warning));
	}

	.ml-toast--error .ml-toast__icon {
		color: var(--ml-toast-error-icon-color, var(--ml-color-danger));
	}

	.ml-toast__content {
		flex: 1;
		min-width: 0;
	}

	.ml-toast__title {
		font-size: var(--ml-toast-title-font-size, var(--ml-text-sm));
		font-weight: var(--ml-toast-title-font-weight, var(--ml-font-semibold));
		color: var(--ml-toast-title-color, var(--ml-color-text));
		line-height: var(--ml-toast-title-line-height, var(--ml-leading-tight));
	}

	.ml-toast__message {
		font-size: var(--ml-toast-message-font-size, var(--ml-text-sm));
		color: var(--ml-toast-message-color, var(--ml-color-text-secondary));
		line-height: var(--ml-toast-message-line-height, var(--ml-leading-relaxed));
		margin-top: var(--ml-toast-message-margin-top, var(--ml-space-1));
	}

	.ml-toast__title + .ml-toast__message {
		margin-top: var(--ml-toast-message-margin-top, var(--ml-space-1));
	}

	.ml-toast__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-toast-dismiss-border-radius, var(--ml-radius-sm));
		cursor: pointer;
		color: var(--ml-toast-dismiss-color, var(--ml-color-text-tertiary));
		transition: color var(--ml-toast-transition-duration, var(--ml-duration-150)) var(--ml-toast-transition-easing, var(--ml-ease-in-out));
	}

	.ml-toast__dismiss:hover {
		color: var(--ml-toast-dismiss-hover-color, var(--ml-color-text));
	}
`;
