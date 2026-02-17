import { css } from '@melodicdev/core';

export const appShellStyles = () => css`
	:host {
		display: block;
		height: 100%;
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
		border-left: var(--ml-border) solid var(--ml-color-border);
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
		border-right: var(--ml-border) solid var(--ml-color-border);
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
		border-bottom: var(--ml-border) solid var(--ml-color-border);
		background-color: var(--ml-color-surface);
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
		width: 6px;
	}

	.ml-app-shell__content::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-app-shell__content::-webkit-scrollbar-thumb {
		background-color: var(--ml-color-border);
		border-radius: var(--ml-radius-full);
	}

	/* ============================================
	   MOBILE MENU BUTTON
	   ============================================ */
	.ml-app-shell__menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		margin-left: var(--ml-space-3);
		padding: 0;
		border: none;
		border-radius: var(--ml-radius);
		background: transparent;
		color: var(--ml-color-text-secondary);
		cursor: pointer;
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-app-shell__menu-btn:hover {
		background-color: var(--ml-color-surface-secondary);
		color: var(--ml-color-text);
	}

	.ml-app-shell__menu-btn:focus-visible {
		outline: 2px solid var(--ml-color-primary);
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
			width: var(--ml-sidebar-width, 280px);
			transform: translateX(-100%);
			transition: transform var(--ml-duration-200) var(--ml-ease-in-out);
			border-right: var(--ml-border) solid var(--ml-color-border);
			background-color: var(--ml-color-surface);
		}

		.ml-app-shell--sidebar-right .ml-app-shell__sidebar {
			left: auto;
			right: 0;
			transform: translateX(100%);
			border-left: var(--ml-border) solid var(--ml-color-border);
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
			background-color: rgba(0, 0, 0, 0.4);
			opacity: 0;
			pointer-events: none;
			transition: opacity var(--ml-duration-200) var(--ml-ease-in-out);
		}

		.ml-app-shell__backdrop--visible {
			opacity: 1;
			pointer-events: auto;
		}
	}
`;
