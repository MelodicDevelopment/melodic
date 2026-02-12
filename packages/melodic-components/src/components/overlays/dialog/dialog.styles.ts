import { css } from '@melodicdev/core';

export const dialogStyles = () => css`
	:host {
		display: contents;
	}

	/* Dialog base */
	dialog.ml-dialog {
		position: fixed;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 500px;
		max-height: calc(100vh - var(--ml-space-8));
		margin: auto;
		padding: 0;
		background-color: var(--ml-color-surface);
		border: none;
		border-radius: var(--ml-radius-xl);
		box-shadow: var(--ml-shadow-xl);
		outline: none;
		overflow: hidden;
		transform: scale(0.95) translateY(10px);
		opacity: 0;
		transition:
			transform var(--ml-transition-normal),
			opacity var(--ml-transition-normal),
			overlay var(--ml-transition-normal) allow-discrete,
			display var(--ml-transition-normal) allow-discrete;
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
			background-color var(--ml-transition-normal),
			overlay var(--ml-transition-normal) allow-discrete,
			display var(--ml-transition-normal) allow-discrete;
	}

	dialog.ml-dialog[open]::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}

	@starting-style {
		dialog.ml-dialog[open]::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	/* Size variants */
	dialog.ml-dialog--sm {
		max-width: 400px;
	}

	dialog.ml-dialog--md {
		max-width: 500px;
	}

	dialog.ml-dialog--lg {
		max-width: 640px;
	}

	dialog.ml-dialog--xl {
		max-width: 800px;
	}

	dialog.ml-dialog--full {
		max-width: calc(100vw - var(--ml-space-8));
		max-height: calc(100vh - var(--ml-space-8));
	}

	/* Header */
	.ml-dialog-header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-space-4);
		padding: var(--ml-space-6);
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
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-dialog-header ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
	}

	/* Body */
	.ml-dialog-body {
		flex: 1;
		padding: var(--ml-space-6);
		overflow-y: auto;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
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
		gap: var(--ml-space-3);
		padding: var(--ml-space-4) var(--ml-space-6);
		border-top: 1px solid var(--ml-color-border);
		background-color: var(--ml-color-surface);
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
