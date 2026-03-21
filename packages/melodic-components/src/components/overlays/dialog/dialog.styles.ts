import { css } from '@melodicdev/core';

export const dialogStyles = () => css`
	:host {
		/* Dialog panel */
		--ml-dialog-max-width: 500px;
		--ml-dialog-bg: var(--ml-color-surface);
		--ml-dialog-radius: var(--ml-radius-xl);
		--ml-dialog-shadow: var(--ml-shadow-xl);
		--ml-dialog-transition: var(--ml-transition-normal);

		/* Backdrop */
		--ml-dialog-backdrop-color: rgba(0, 0, 0, 0.5);

		/* Size variants */
		--ml-dialog-sm-max-width: 400px;
		--ml-dialog-md-max-width: 500px;
		--ml-dialog-lg-max-width: 640px;
		--ml-dialog-xl-max-width: 800px;

		/* Header */
		--ml-dialog-header-padding: var(--ml-space-6);
		--ml-dialog-header-gap: var(--ml-space-4);
		--ml-dialog-header-title-font-size: var(--ml-text-lg);
		--ml-dialog-header-title-font-weight: var(--ml-font-semibold);
		--ml-dialog-header-title-color: var(--ml-color-text);
		--ml-dialog-header-title-line-height: var(--ml-leading-tight);
		--ml-dialog-header-desc-font-size: var(--ml-text-sm);
		--ml-dialog-header-desc-color: var(--ml-color-text-secondary);
		--ml-dialog-header-desc-line-height: var(--ml-leading-relaxed);

		/* Body */
		--ml-dialog-body-padding: var(--ml-space-6);
		--ml-dialog-body-font-size: var(--ml-text-sm);
		--ml-dialog-body-color: var(--ml-color-text-secondary);
		--ml-dialog-body-line-height: var(--ml-leading-relaxed);

		/* Footer */
		--ml-dialog-footer-padding-y: var(--ml-space-4);
		--ml-dialog-footer-padding-x: var(--ml-space-6);
		--ml-dialog-footer-gap: var(--ml-space-3);
		--ml-dialog-footer-border-color: var(--ml-color-border);
		--ml-dialog-footer-bg: var(--ml-color-surface);

		display: contents;
	}

	/* Dialog base */
	dialog.ml-dialog {
		position: fixed;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: var(--ml-dialog-max-width);
		max-height: calc(100vh - var(--ml-space-8));
		margin: auto;
		padding: 0;
		background-color: var(--ml-dialog-bg);
		border: none;
		border-radius: var(--ml-dialog-radius);
		box-shadow: var(--ml-dialog-shadow);
		outline: none;
		overflow: hidden;
		transform: scale(0.95) translateY(10px);
		opacity: 0;
		transition:
			transform var(--ml-dialog-transition),
			opacity var(--ml-dialog-transition),
			overlay var(--ml-dialog-transition) allow-discrete,
			display var(--ml-dialog-transition) allow-discrete;
	}

	dialog.ml-dialog[open] {
		transform: scale(1) translateY(0);
		opacity: 1;
	}

	@starting-style {
		dialog.ml-dialog[open] {
			transform: scale(0.95) translateY(10px);
			opacity: 0;
		}
	}

	/* Backdrop */
	dialog.ml-dialog::backdrop {
		background-color: rgba(0, 0, 0, 0);
		transition:
			background-color var(--ml-dialog-transition),
			overlay var(--ml-dialog-transition) allow-discrete,
			display var(--ml-dialog-transition) allow-discrete;
	}

	dialog.ml-dialog[open]::backdrop {
		background-color: var(--ml-dialog-backdrop-color);
	}

	@starting-style {
		dialog.ml-dialog[open]::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	/* Size variants */
	dialog.ml-dialog--sm {
		max-width: var(--ml-dialog-sm-max-width);
	}

	dialog.ml-dialog--md {
		max-width: var(--ml-dialog-md-max-width);
	}

	dialog.ml-dialog--lg {
		max-width: var(--ml-dialog-lg-max-width);
	}

	dialog.ml-dialog--xl {
		max-width: var(--ml-dialog-xl-max-width);
	}

	dialog.ml-dialog--full {
		max-width: calc(100vw - var(--ml-space-8));
		max-height: calc(100vh - var(--ml-space-8));
	}

	/* Header */
	.ml-dialog-header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-dialog-header-gap);
		padding: var(--ml-dialog-header-padding);
		padding-bottom: 0;
	}

	.ml-dialog-header:not(:has(*)) {
		display: none;
	}

	.ml-dialog-header ::slotted(*) {
		flex: 1;
		min-width: 0;
	}

	.ml-dialog-header ::slotted(h1),
	.ml-dialog-header ::slotted(h2),
	.ml-dialog-header ::slotted(h3),
	.ml-dialog-header ::slotted(h4) {
		margin: 0;
		font-size: var(--ml-dialog-header-title-font-size);
		font-weight: var(--ml-dialog-header-title-font-weight);
		color: var(--ml-dialog-header-title-color);
		line-height: var(--ml-dialog-header-title-line-height);
	}

	.ml-dialog-header ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-dialog-header-desc-font-size);
		color: var(--ml-dialog-header-desc-color);
		line-height: var(--ml-dialog-header-desc-line-height);
	}

	/* Body */
	.ml-dialog-body {
		flex: 1;
		padding: var(--ml-dialog-body-padding);
		overflow-y: auto;
		font-size: var(--ml-dialog-body-font-size);
		color: var(--ml-dialog-body-color);
		line-height: var(--ml-dialog-body-line-height);
	}

	.ml-dialog-body ::slotted(p) {
		margin: 0;
	}

	.ml-dialog-body ::slotted(p + p) {
		margin-top: var(--ml-space-4);
	}

	/* Footer */
	.ml-dialog-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--ml-dialog-footer-gap);
		padding: var(--ml-dialog-footer-padding-y) var(--ml-dialog-footer-padding-x);
		border-top: 1px solid var(--ml-dialog-footer-border-color);
		background-color: var(--ml-dialog-footer-bg);
	}

	.ml-dialog-footer:not(:has(*)) {
		display: none;
	}

	/* Responsive */
	@media (max-width: 640px) {
		dialog.ml-dialog {
			max-width: 100%;
			max-height: 90vh;
			margin: auto auto 0;
			border-bottom-left-radius: 0;
			border-bottom-right-radius: 0;
		}

		dialog.ml-dialog--full {
			max-height: 100vh;
			border-radius: 0;
		}

		.ml-dialog-header,
		.ml-dialog-body,
		.ml-dialog-footer {
			padding-left: var(--ml-space-4);
			padding-right: var(--ml-space-4);
		}

		.ml-dialog-footer {
			flex-wrap: wrap;
		}
	}
`;
