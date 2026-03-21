import { css } from '@melodicdev/core';

export const appShellStyles = () => css`
	:host {
		display: block;
		height: 100%;

		/* Border */
		--ml-app-shell-border-width: var(--ml-border);
		--ml-app-shell-border-color: var(--ml-color-border);

		/* Header */
		--ml-app-shell-header-bg: var(--ml-color-surface);

		/* Mobile sidebar */
		--ml-app-shell-sidebar-width: var(--ml-sidebar-width, 280px);
		--ml-app-shell-sidebar-bg: var(--ml-color-surface);
		--ml-app-shell-sidebar-transition: var(--ml-duration-200);

		/* Backdrop */
		--ml-app-shell-backdrop-bg: rgba(0, 0, 0, 0.4);
		--ml-app-shell-backdrop-transition: var(--ml-duration-200);

		/* Menu button */
		--ml-app-shell-menu-btn-size: 36px;
		--ml-app-shell-menu-btn-margin: var(--ml-space-3);
		--ml-app-shell-menu-btn-radius: var(--ml-radius);
		--ml-app-shell-menu-btn-color: var(--ml-color-text-secondary);
		--ml-app-shell-menu-btn-hover-bg: var(--ml-color-surface-secondary);
		--ml-app-shell-menu-btn-hover-color: var(--ml-color-text);
		--ml-app-shell-menu-btn-focus-color: var(--ml-color-primary);
		--ml-app-shell-menu-btn-transition: var(--ml-duration-150);

		/* Scrollbar */
		--ml-app-shell-scrollbar-width: 6px;
		--ml-app-shell-scrollbar-thumb-color: var(--ml-color-border);
		--ml-app-shell-scrollbar-thumb-radius: var(--ml-radius-full);
	}

	/* ============================================
	   SHELL GRID LAYOUT
	   ============================================ */
	.ml-app-shell {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: 1fr;
		height: 100%;
		overflow: hidden;
	}

	/* Sidebar on the right */
	.ml-app-shell--sidebar-right {
		grid-template-columns: 1fr auto;
	}

	.ml-app-shell--sidebar-right .ml-app-shell__sidebar {
		order: 2;
		border-left: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
		border-right: none;
	}

	.ml-app-shell--sidebar-right .ml-app-shell__main {
		order: 1;
	}

	/* ============================================
	   SIDEBAR
	   ============================================ */
	.ml-app-shell__sidebar {
		grid-row: 1 / -1;
		overflow: hidden;
		border-right: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
	}

	::slotted([slot="sidebar"]) {
		height: 100%;
	}

	/* ============================================
	   MAIN AREA
	   ============================================ */
	.ml-app-shell__main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-app-shell__header {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		border-bottom: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
		background-color: var(--ml-app-shell-header-bg);
	}

	.ml-app-shell__header:empty {
		display: none;
	}

	/* Fixed/sticky header */
	.ml-app-shell--header-fixed .ml-app-shell__header {
		position: sticky;
		top: 0;
		z-index: 10;
	}

	/* ============================================
	   CONTENT
	   ============================================ */
	.ml-app-shell__content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* Scrollbar styling */
	.ml-app-shell__content::-webkit-scrollbar {
		width: var(--ml-app-shell-scrollbar-width);
	}

	.ml-app-shell__content::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-app-shell__content::-webkit-scrollbar-thumb {
		background-color: var(--ml-app-shell-scrollbar-thumb-color);
		border-radius: var(--ml-app-shell-scrollbar-thumb-radius);
	}

	/* ============================================
	   MOBILE MENU BUTTON
	   ============================================ */
	.ml-app-shell__menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-app-shell-menu-btn-size);
		height: var(--ml-app-shell-menu-btn-size);
		margin-left: var(--ml-app-shell-menu-btn-margin);
		padding: 0;
		border: none;
		border-radius: var(--ml-app-shell-menu-btn-radius);
		background: transparent;
		color: var(--ml-app-shell-menu-btn-color);
		cursor: pointer;
		transition: background-color var(--ml-app-shell-menu-btn-transition) var(--ml-ease-in-out);
	}

	.ml-app-shell__menu-btn:hover {
		background-color: var(--ml-app-shell-menu-btn-hover-bg);
		color: var(--ml-app-shell-menu-btn-hover-color);
	}

	.ml-app-shell__menu-btn:focus-visible {
		outline: 2px solid var(--ml-app-shell-menu-btn-focus-color);
		outline-offset: -2px;
	}

	/* ============================================
	   MOBILE BACKDROP
	   ============================================ */
	.ml-app-shell__backdrop {
		display: none;
	}

	/* ============================================
	   RESPONSIVE: MOBILE (<768px)
	   ============================================ */
	@media (max-width: 767px) {
		.ml-app-shell {
			grid-template-columns: 1fr;
		}

		.ml-app-shell__sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			z-index: 50;
			width: var(--ml-app-shell-sidebar-width);
			transform: translateX(-100%);
			transition: transform var(--ml-app-shell-sidebar-transition) var(--ml-ease-in-out);
			border-right: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
			background-color: var(--ml-app-shell-sidebar-bg);
		}

		.ml-app-shell--sidebar-right .ml-app-shell__sidebar {
			left: auto;
			right: 0;
			transform: translateX(100%);
			border-left: var(--ml-app-shell-border-width) solid var(--ml-app-shell-border-color);
			border-right: none;
		}

		.ml-app-shell__sidebar--mobile-open {
			transform: translateX(0);
		}

		/* Backdrop */
		.ml-app-shell__backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 40;
			background-color: var(--ml-app-shell-backdrop-bg);
			opacity: 0;
			pointer-events: none;
			transition: opacity var(--ml-app-shell-backdrop-transition) var(--ml-ease-in-out);
		}

		.ml-app-shell__backdrop--visible {
			opacity: 1;
			pointer-events: auto;
		}
	}
`;
