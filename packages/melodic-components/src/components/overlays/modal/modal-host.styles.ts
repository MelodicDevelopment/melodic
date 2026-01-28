import { css } from '@melodicdev/core';

export const modalHostStyles = () => css`
	:host {
		display: contents;
	}

	/* Backdrop */
	.ml-modal-host__backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--ml-space-4);
		background-color: rgba(0, 0, 0, 0.5);
		opacity: 0;
		visibility: hidden;
		transition: opacity var(--ml-transition-normal), visibility var(--ml-transition-normal);
	}

	.ml-modal-host__backdrop--open {
		opacity: 1;
		visibility: visible;
	}

	/* Dialog */
	.ml-modal-host__dialog {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-height: calc(100vh - var(--ml-space-8));
		background-color: var(--ml-color-surface);
		border-radius: var(--ml-radius-xl);
		box-shadow: var(--ml-shadow-xl);
		outline: none;
		transform: scale(0.95) translateY(10px);
		transition: transform var(--ml-transition-normal);
		overflow: hidden;
	}

	.ml-modal-host__backdrop--open .ml-modal-host__dialog {
		transform: scale(1) translateY(0);
	}

	/* Size variants */
	.ml-modal-host__dialog--sm {
		max-width: 400px;
	}

	.ml-modal-host__dialog--md {
		max-width: 500px;
	}

	.ml-modal-host__dialog--lg {
		max-width: 640px;
	}

	.ml-modal-host__dialog--xl {
		max-width: 800px;
	}

	.ml-modal-host__dialog--full {
		max-width: calc(100vw - var(--ml-space-8));
		max-height: calc(100vh - var(--ml-space-8));
	}

	/* Close button */
	.ml-modal-host__close {
		position: absolute;
		top: var(--ml-space-4);
		right: var(--ml-space-4);
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: none;
		border-radius: var(--ml-radius-md);
		background-color: transparent;
		color: var(--ml-color-text-secondary);
		cursor: pointer;
		transition: background-color var(--ml-transition-fast), color var(--ml-transition-fast);
		z-index: 1;
	}

	.ml-modal-host__close:hover {
		background-color: var(--ml-color-surface-secondary, var(--ml-gray-100));
		color: var(--ml-color-text);
	}

	.ml-modal-host__close:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: 2px;
	}

	/* Content container */
	.ml-modal-host__content {
		flex: 1;
		overflow-y: auto;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.ml-modal-host__backdrop {
			padding: var(--ml-space-2);
			align-items: flex-end;
		}

		.ml-modal-host__dialog {
			max-width: 100%;
			max-height: 90vh;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		.ml-modal-host__dialog--full {
			max-height: 100vh;
			border-radius: 0;
		}
	}
`;
