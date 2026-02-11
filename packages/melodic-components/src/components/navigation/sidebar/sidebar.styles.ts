import { css } from '@melodicdev/core';

export const sidebarStyles = () => css`
	:host {
		display: block;
		height: 100%;
	}

	/* ============================================
	   SIDEBAR CONTAINER
	   ============================================ */
	.ml-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: var(--ml-sidebar-width, 280px);
		background-color: var(--ml-color-surface);
		border-right: var(--ml-border) solid var(--ml-color-border);
		transition: width var(--ml-duration-200) var(--ml-ease-in-out);
	}

	/* Slim variant - collapsed (icons only) */
	.ml-sidebar--slim {
		--ml-sidebar-width: 64px;
		overflow: hidden;
	}

	/* Slim variant - expanded on hover */
	.ml-sidebar--slim:not(.ml-sidebar--collapsed) {
		--ml-sidebar-width: 280px;
		box-shadow: var(--ml-shadow-lg);
		z-index: 50;
		position: relative;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-sidebar__header {
		flex-shrink: 0;
		padding: var(--ml-space-4);
		border-bottom: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-sidebar__header:empty {
		display: none;
	}

	/* ============================================
	   SEARCH
	   ============================================ */
	.ml-sidebar__search {
		flex-shrink: 0;
		padding: var(--ml-space-3) var(--ml-space-4);
	}

	/* ============================================
	   MAIN NAV AREA
	   ============================================ */
	.ml-sidebar__main {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--ml-space-2) 0;
	}

	/* Scrollbar styling */
	.ml-sidebar__main::-webkit-scrollbar {
		width: 4px;
	}

	.ml-sidebar__main::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-sidebar__main::-webkit-scrollbar-thumb {
		background-color: var(--ml-color-border);
		border-radius: var(--ml-radius-full);
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-sidebar__footer {
		flex-shrink: 0;
		margin-top: auto;
		border-top: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-sidebar__footer-nav {
		padding: var(--ml-space-2);
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
	}

	.ml-sidebar__footer-nav:empty {
		display: none;
	}

	.ml-sidebar__feature {
		padding: var(--ml-space-3) var(--ml-space-4);
	}

	.ml-sidebar__user {
		padding: var(--ml-space-3) var(--ml-space-4);
		border-top: var(--ml-border) solid var(--ml-color-border);
	}

	/* ============================================
	   CONFIG-RENDERED GROUPS
	   ============================================ */
	.ml-sidebar__group {
		padding: var(--ml-space-1) 0;
	}

	.ml-sidebar__group-label {
		display: block;
		padding: var(--ml-space-2) var(--ml-space-4);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		line-height: var(--ml-leading-tight);
	}

	.ml-sidebar__group-items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-0-5);
		padding: 0 var(--ml-space-2);
	}

	/* ============================================
	   CONFIG-RENDERED ITEMS
	   ============================================ */
	.ml-sidebar__item {
		--level: 0;
	}

	.ml-sidebar__item-link {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-space-2) var(--ml-space-3);
		padding-left: calc(var(--ml-space-3) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-radius: var(--ml-radius);
		background: transparent;
		color: var(--ml-color-text-secondary);
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		line-height: var(--ml-leading-tight);
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-duration-150) var(--ml-ease-in-out),
			color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-sidebar__item-link:hover:not(.ml-sidebar__item-link--disabled):not(.ml-sidebar__item-link--active) {
		background-color: var(--ml-gray-100);
		color: var(--ml-color-text);
	}

	.ml-sidebar__item-link:focus-visible {
		outline: 2px solid var(--ml-color-primary);
		outline-offset: -2px;
	}

	.ml-sidebar__item-link--active {
		background-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
	}

	.ml-sidebar__item-link--active:hover {
		background-color: var(--ml-color-primary-hover);
		color: var(--ml-color-text-inverse);
	}

	.ml-sidebar__item-link--disabled {
		color: var(--ml-color-text-muted);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.ml-sidebar__item-link--collapsed {
		justify-content: center;
		padding: var(--ml-space-2);
	}

	/* Leading area (icon) */
	.ml-sidebar__item-leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		color: inherit;
	}

	/* Label */
	.ml-sidebar__item-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Trailing area */
	.ml-sidebar__item-trailing {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		flex-shrink: 0;
	}

	/* Badge */
	.ml-sidebar__item-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 var(--ml-space-1-5);
		border-radius: var(--ml-radius-full);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		line-height: 1;
		background-color: var(--ml-color-surface-tertiary);
		color: var(--ml-color-text-secondary);
	}

	.ml-sidebar__item-badge--primary {
		background-color: var(--ml-color-primary-subtle);
		color: var(--ml-color-primary);
	}

	.ml-sidebar__item-badge--success {
		background-color: var(--ml-color-success-subtle);
		color: var(--ml-color-success);
	}

	.ml-sidebar__item-badge--warning {
		background-color: var(--ml-color-warning-subtle);
		color: var(--ml-color-warning);
	}

	.ml-sidebar__item-badge--error {
		background-color: var(--ml-color-error-subtle);
		color: var(--ml-color-error);
	}

	/* Chevron for expandable items */
	.ml-sidebar__item-chevron {
		transition: transform var(--ml-duration-200) var(--ml-ease-in-out);
	}

	.ml-sidebar__item-link--expanded .ml-sidebar__item-chevron {
		transform: rotate(90deg);
	}

	/* Submenu */
	.ml-sidebar__item-submenu {
		overflow: hidden;
	}

	/* ============================================
	   COLLAPSED STATE (slim + collapsed)
	   ============================================ */
	.ml-sidebar--collapsed .ml-sidebar__search,
	.ml-sidebar--collapsed .ml-sidebar__feature,
	.ml-sidebar--collapsed .ml-sidebar__group-label {
		display: none;
	}

	/* Slotted elements in collapsed state */
	::slotted([slot="search"]),
	::slotted([slot="feature"]) {
		transition: opacity var(--ml-duration-150) var(--ml-ease-in-out);
	}
`;
