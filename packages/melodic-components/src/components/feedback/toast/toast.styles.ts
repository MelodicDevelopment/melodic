import { css } from '@melodicdev/core';

export const toastStyles = () => css`
	:host {
		display: block;
	}

	.ml-toast {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4);
		background-color: var(--ml-color-surface);
		border: 1px solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		box-shadow: var(--ml-shadow-lg);
		min-width: 320px;
		max-width: 420px;
		animation: ml-toast-in var(--ml-duration-300) var(--ml-ease-out);
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
		color: var(--ml-color-primary);
	}

	.ml-toast--success .ml-toast__icon {
		color: var(--ml-color-success);
	}

	.ml-toast--warning .ml-toast__icon {
		color: var(--ml-color-warning);
	}

	.ml-toast--error .ml-toast__icon {
		color: var(--ml-color-danger);
	}

	.ml-toast__content {
		flex: 1;
		min-width: 0;
	}

	.ml-toast__title {
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-toast__message {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
		margin-top: var(--ml-space-1);
	}

	.ml-toast__title + .ml-toast__message {
		margin-top: var(--ml-space-1);
	}

	.ml-toast__dismiss {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-radius-sm);
		cursor: pointer;
		color: var(--ml-color-text-tertiary);
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-toast__dismiss:hover {
		color: var(--ml-color-text);
	}
`;
