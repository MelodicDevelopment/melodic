import { css } from '@melodicdev/core';

export const drawerStyles = () => css`
	:host {
		/* Backdrop */
		--ml-drawer-backdrop-color: rgba(0, 0, 0, 0.5);
		--ml-drawer-backdrop-transition: var(--ml-duration-300) var(--ml-ease-out);

		/* Panel */
		--ml-drawer-bg: var(--ml-color-surface);
		--ml-drawer-shadow: var(--ml-shadow-xl);

		/* Size variants */
		--ml-drawer-sm-width: 320px;
		--ml-drawer-md-width: 480px;
		--ml-drawer-lg-width: 640px;
		--ml-drawer-xl-width: 800px;

		/* Header */
		--ml-drawer-header-padding: var(--ml-space-6);
		--ml-drawer-header-gap: var(--ml-space-4);
		--ml-drawer-header-title-font-size: var(--ml-text-lg);
		--ml-drawer-header-title-font-weight: var(--ml-font-semibold);
		--ml-drawer-header-title-color: var(--ml-color-text);
		--ml-drawer-header-title-line-height: var(--ml-leading-tight);
		--ml-drawer-header-desc-font-size: var(--ml-text-sm);
		--ml-drawer-header-desc-color: var(--ml-color-text-secondary);

		/* Close button */
		--ml-drawer-close-size: 32px;
		--ml-drawer-close-radius: var(--ml-radius-md);
		--ml-drawer-close-color: var(--ml-color-text-tertiary);
		--ml-drawer-close-hover-bg: var(--ml-color-surface-hover);
		--ml-drawer-close-hover-color: var(--ml-color-text);
		--ml-drawer-close-transition: var(--ml-duration-150) var(--ml-ease-in-out);

		/* Body */
		--ml-drawer-body-padding: var(--ml-space-6);
		--ml-drawer-body-font-size: var(--ml-text-sm);
		--ml-drawer-body-color: var(--ml-color-text-secondary);
		--ml-drawer-body-line-height: var(--ml-leading-relaxed);

		/* Footer */
		--ml-drawer-footer-padding-y: var(--ml-space-4);
		--ml-drawer-footer-padding-x: var(--ml-space-6);
		--ml-drawer-footer-gap: var(--ml-space-3);
		--ml-drawer-footer-border-color: var(--ml-color-border);

		display: contents;
	}

	dialog.ml-drawer {
		position: fixed;
		inset: 0;
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
			background-color var(--ml-drawer-backdrop-transition),
			overlay var(--ml-drawer-backdrop-transition) allow-discrete,
			display var(--ml-drawer-backdrop-transition) allow-discrete;
	}

	dialog.ml-drawer[open]::backdrop {
		background-color: var(--ml-drawer-backdrop-color);
	}

	@starting-style {
		dialog.ml-drawer[open]::backdrop {
			background-color: rgba(0, 0, 0, 0);
		}
	}

	/* Panel */
	.ml-drawer__panel {
		position: absolute;
		top: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--ml-drawer-bg);
		box-shadow: var(--ml-drawer-shadow);
	}

	/* Side variants - panel is off-screen by default */
	dialog.ml-drawer--right .ml-drawer__panel {
		right: 0;
	}

	dialog.ml-drawer--left .ml-drawer__panel {
		left: 0;
	}

	/* Size variants */
	.ml-drawer--sm .ml-drawer__panel {
		width: var(--ml-drawer-sm-width);
	}

	.ml-drawer--md .ml-drawer__panel {
		width: var(--ml-drawer-md-width);
	}

	.ml-drawer--lg .ml-drawer__panel {
		width: var(--ml-drawer-lg-width);
	}

	.ml-drawer--xl .ml-drawer__panel {
		width: var(--ml-drawer-xl-width);
	}

	/* Header */
	.ml-drawer__header {
		display: flex;
		align-items: flex-start;
		gap: var(--ml-drawer-header-gap);
		padding: var(--ml-drawer-header-padding);
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
		font-size: var(--ml-drawer-header-title-font-size);
		font-weight: var(--ml-drawer-header-title-font-weight);
		color: var(--ml-drawer-header-title-color);
		line-height: var(--ml-drawer-header-title-line-height);
	}

	.ml-drawer__header-content ::slotted(p) {
		margin: var(--ml-space-1) 0 0;
		font-size: var(--ml-drawer-header-desc-font-size);
		color: var(--ml-drawer-header-desc-color);
	}

	.ml-drawer__close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--ml-drawer-close-size);
		height: var(--ml-drawer-close-size);
		padding: 0;
		background: none;
		border: none;
		border-radius: var(--ml-drawer-close-radius);
		cursor: pointer;
		color: var(--ml-drawer-close-color);
		transition:
			background-color var(--ml-drawer-close-transition),
			color var(--ml-drawer-close-transition);
	}

	.ml-drawer__close:hover {
		background-color: var(--ml-drawer-close-hover-bg);
		color: var(--ml-drawer-close-hover-color);
	}

	/* Body */
	.ml-drawer__body {
		flex: 1;
		padding: var(--ml-drawer-body-padding);
		overflow-y: auto;
		font-size: var(--ml-drawer-body-font-size);
		color: var(--ml-drawer-body-color);
		line-height: var(--ml-drawer-body-line-height);
	}

	/* Footer */
	.ml-drawer__footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--ml-drawer-footer-gap);
		padding: var(--ml-drawer-footer-padding-y) var(--ml-drawer-footer-padding-x);
		border-top: 1px solid var(--ml-drawer-footer-border-color);
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
