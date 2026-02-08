import { css } from '@melodicdev/core';

export const drawerStyles = () => css`
	:host {
		display: contents;
	}

	dialog.ml-drawer {
		position: fixed;
		display: flex;
		margin: 0;
		padding: 0;
		border: none;
		background: transparent;
		max-width: none;
		max-height: none;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	dialog.ml-drawer:not([open]) {
		display: none;
	}

	/* Backdrop */
	dialog.ml-drawer::backdrop {
		background-color: rgba(0, 0, 0, 0);
		transition:
			background-color var(--ml-duration-300) var(--ml-ease-out),
			overlay var(--ml-duration-300) var(--ml-ease-out) allow-discrete,
			display var(--ml-duration-300) var(--ml-ease-out) allow-discrete;
	}

	dialog.ml-drawer[open]::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}

	@starting-style {
		dialog.ml-drawer[open]::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	/* Panel */
	.ml-drawer__panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--ml-color-surface);
		box-shadow: var(--ml-shadow-xl);
	}

	/* Side variants */
	dialog.ml-drawer--right {
		justify-content: flex-end;
	}

	dialog.ml-drawer--left {
		justify-content: flex-start;
	}

	/* Size variants */
	.ml-drawer--sm .ml-drawer__panel {
		width: 320px;
	}

	.ml-drawer--md .ml-drawer__panel {
		width: 480px;
	}

	.ml-drawer--lg .ml-drawer__panel {
		width: 640px;
	}

	.ml-drawer--xl .ml-drawer__panel {
		width: 800px;
	}

	/* Header */
	.ml-drawer__header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-space-4);
		padding: var(--ml-space-6);
		padding-bottom: 0;
	}

	.ml-drawer__header:not(:has(slot[name="drawer-header"] *)) {
		padding-bottom: 0;
	}

	.ml-drawer__header-content {
		flex: 1;
		min-width: 0;
	}

	.ml-drawer__header-content ::slotted(h1),
	.ml-drawer__header-content ::slotted(h2),
	.ml-drawer__header-content ::slotted(h3),
	.ml-drawer__header-content ::slotted(h4) {
		margin: 0;
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-drawer__header-content ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
	}

	.ml-drawer__close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-radius-md);
		cursor: pointer;
		color: var(--ml-color-text-tertiary);
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-drawer__close:hover {
		background-color: var(--ml-color-surface-hover);
		color: var(--ml-color-text);
	}

	/* Body */
	.ml-drawer__body {
		flex: 1;
		padding: var(--ml-space-6);
		overflow-y: auto;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
	}

	/* Footer */
	.ml-drawer__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--ml-space-3);
		padding: var(--ml-space-4) var(--ml-space-6);
		border-top: 1px solid var(--ml-color-border);
	}

	.ml-drawer__footer:not(:has(*)) {
		display: none;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.ml-drawer__panel {
			width: 100% !important;
		}
	}
`;
