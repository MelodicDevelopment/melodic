import { css } from '@melodicdev/core';

export const modalStyles = () => css`
	:host {
		display: contents;
	}

	/* Backdrop */
	.ml-modal__backdrop {
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

	.ml-modal__backdrop--open {
		opacity: 1;
		visibility: visible;
	}

	/* Dialog */
	.ml-modal__dialog {
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

	.ml-modal__backdrop--open .ml-modal__dialog {
		transform: scale(1) translateY(0);
	}

	/* Size variants */
	.ml-modal__dialog--sm {
		max-width: 400px;
	}

	.ml-modal__dialog--md {
		max-width: 500px;
	}

	.ml-modal__dialog--lg {
		max-width: 640px;
	}

	.ml-modal__dialog--xl {
		max-width: 800px;
	}

	.ml-modal__dialog--full {
		max-width: calc(100vw - var(--ml-space-8));
		max-height: calc(100vh - var(--ml-space-8));
	}

	/* Hero image */
	.ml-modal__hero {
		display: none;
	}

	.ml-modal__hero:has(*)  {
		display: block;
	}

	.ml-modal__hero ::slotted(*) {
		display: block;
		width: 100%;
		height: auto;
		object-fit: cover;
	}

	/* Header */
	.ml-modal__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-6);
		padding-bottom: 0;
	}

	.ml-modal__header-content {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-space-4);
		flex: 1;
		min-width: 0;
	}

	/* Header layout: stacked (icon above title) */
	.ml-modal__dialog--header-stacked .ml-modal__header-content {
		flex-direction: column;
		gap: var(--ml-space-4);
	}

	/* Header alignment: center */
	.ml-modal__dialog--align-center .ml-modal__header {
		text-align: center;
	}

	.ml-modal__dialog--align-center .ml-modal__header-content {
		align-items: center;
		justify-content: center;
	}

	/* Icon slot */
	.ml-modal__icon {
		display: none;
		flex-shrink: 0;
	}

	.ml-modal__icon:has(*) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-modal__icon ::slotted(*) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--ml-radius-lg);
		background-color: var(--ml-color-surface-secondary, var(--ml-gray-50));
		border: 1px solid var(--ml-color-border);
		color: var(--ml-color-text-secondary);
	}

	.ml-modal__icon ::slotted(ml-icon) {
		font-size: var(--ml-text-xl);
	}

	/* Titles */
	.ml-modal__titles {
		flex: 1;
		min-width: 0;
	}

	.ml-modal__title {
		margin: 0;
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-modal__description {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
	}

	/* Close button */
	.ml-modal__close {
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
		flex-shrink: 0;
	}

	.ml-modal__close:hover {
		background-color: var(--ml-color-surface-secondary, var(--ml-gray-100));
		color: var(--ml-color-text);
	}

	.ml-modal__close:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: 2px;
	}

	/* Body */
	.ml-modal__body {
		flex: 1;
		padding: var(--ml-space-6);
		overflow-y: auto;
	}

	/* Remove top padding if no header */
	.ml-modal__dialog:not(:has(.ml-modal__header)) .ml-modal__body {
		padding-top: var(--ml-space-6);
	}

	/* Footer */
	.ml-modal__footer {
		display: none;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4) var(--ml-space-6);
		border-top: 1px solid var(--ml-color-border);
		background-color: var(--ml-color-surface);
	}

	.ml-modal__footer:has(*) {
		display: flex;
	}

	.ml-modal__footer-start {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-modal__footer-start:empty {
		display: none;
	}

	.ml-modal__footer-end {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
		margin-left: auto;
	}

	.ml-modal__footer-end:empty {
		display: none;
	}

	/* When only footer-end has content, align to the right */
	.ml-modal__footer:has(.ml-modal__footer-start:empty) .ml-modal__footer-end {
		margin-left: auto;
	}

	/* When only footer-start has content, don't push to right */
	.ml-modal__footer:has(.ml-modal__footer-end:empty) .ml-modal__footer-start {
		margin-left: 0;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.ml-modal__backdrop {
			padding: var(--ml-space-2);
			align-items: flex-end;
		}

		.ml-modal__dialog {
			max-width: 100%;
			max-height: 90vh;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		.ml-modal__dialog--full {
			max-height: 100vh;
			border-radius: 0;
		}

		.ml-modal__header,
		.ml-modal__body,
		.ml-modal__footer {
			padding-left: var(--ml-space-4);
			padding-right: var(--ml-space-4);
		}

		.ml-modal__footer {
			flex-wrap: wrap;
		}

		.ml-modal__footer-start,
		.ml-modal__footer-end {
			flex-wrap: wrap;
		}
	}
`;
