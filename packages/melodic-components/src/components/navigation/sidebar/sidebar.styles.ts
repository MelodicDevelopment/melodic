import { css } from '@melodicdev/core';

export const sidebarStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Container
	 * --ml-sidebar-width: 280px
	 * --ml-sidebar-bg: var(--ml-color-surface)
	 * --ml-sidebar-border-width: var(--ml-border)
	 * --ml-sidebar-border-color: var(--ml-color-border)
	 * --ml-sidebar-transition: var(--ml-duration-200) var(--ml-ease-in-out)
	 *
	 * Slim expanded shadow
	 * --ml-sidebar-slim-expanded-shadow: var(--ml-shadow-lg)
	 *
	 * Header
	 * --ml-sidebar-header-padding: var(--ml-space-4)
	 *
	 * Search
	 * --ml-sidebar-search-padding-y: var(--ml-space-3)
	 * --ml-sidebar-search-padding-x: var(--ml-space-4)
	 *
	 * Main nav area
	 * --ml-sidebar-main-padding-y: var(--ml-space-2)
	 *
	 * Scrollbar
	 * --ml-sidebar-scrollbar-width: 4px
	 * --ml-sidebar-scrollbar-color: var(--ml-color-border)
	 * --ml-sidebar-scrollbar-radius: var(--ml-radius-full)
	 *
	 * Footer
	 * --ml-sidebar-footer-nav-padding: var(--ml-space-2)
	 * --ml-sidebar-footer-nav-gap: var(--ml-space-0-5)
	 * --ml-sidebar-feature-padding-y: var(--ml-space-3)
	 * --ml-sidebar-feature-padding-x: var(--ml-space-4)
	 * --ml-sidebar-user-padding-y: var(--ml-space-3)
	 * --ml-sidebar-user-padding-x: var(--ml-space-4)
	 *
	 * Group label
	 * --ml-sidebar-group-label-padding-y: var(--ml-space-2)
	 * --ml-sidebar-group-label-padding-x: var(--ml-space-4)
	 * --ml-sidebar-group-label-font-family: var(--ml-font-sans)
	 * --ml-sidebar-group-label-font-size: var(--ml-text-xs)
	 * --ml-sidebar-group-label-font-weight: var(--ml-font-semibold)
	 * --ml-sidebar-group-label-color: var(--ml-color-text-muted)
	 * --ml-sidebar-group-label-letter-spacing: 0.05em
	 * --ml-sidebar-group-label-line-height: var(--ml-leading-tight)
	 *
	 * Group items
	 * --ml-sidebar-group-items-gap: var(--ml-space-0-5)
	 * --ml-sidebar-group-items-padding-x: var(--ml-space-2)
	 *
	 * Item link
	 * --ml-sidebar-item-gap: var(--ml-space-3)
	 * --ml-sidebar-item-padding-y: var(--ml-space-2)
	 * --ml-sidebar-item-padding-x: var(--ml-space-3)
	 * --ml-sidebar-item-radius: var(--ml-radius)
	 * --ml-sidebar-item-color: var(--ml-color-text-secondary)
	 * --ml-sidebar-item-font-family: var(--ml-font-sans)
	 * --ml-sidebar-item-font-size: var(--ml-text-sm)
	 * --ml-sidebar-item-font-weight: var(--ml-font-medium)
	 * --ml-sidebar-item-line-height: var(--ml-leading-tight)
	 * --ml-sidebar-item-transition: var(--ml-duration-150) var(--ml-ease-in-out)
	 *
	 * Item hover
	 * --ml-sidebar-item-hover-bg: var(--ml-gray-100)
	 * --ml-sidebar-item-hover-color: var(--ml-color-text)
	 *
	 * Item focus
	 * --ml-sidebar-item-focus-color: var(--ml-color-primary)
	 *
	 * Item active
	 * --ml-sidebar-item-active-bg: var(--ml-color-primary)
	 * --ml-sidebar-item-active-color: var(--ml-color-text-inverse)
	 * --ml-sidebar-item-active-hover-bg: var(--ml-color-primary-hover)
	 *
	 * Active indicator (left border accent)
	 * --ml-sidebar-item-active-indicator-width: 0px
	 * --ml-sidebar-item-active-indicator-color: transparent
	 *
	 * Item disabled
	 * --ml-sidebar-item-disabled-color: var(--ml-color-text-muted)
	 * --ml-sidebar-item-disabled-opacity: 0.6
	 *
	 * Icon colors (separate from text)
	 * --ml-sidebar-item-icon-color: inherit
	 * --ml-sidebar-item-active-icon-color: inherit
	 * --ml-sidebar-item-hover-icon-color: inherit
	 *
	 * Item icon size
	 * --ml-sidebar-item-icon-size: 20px
	 *
	 * Item trailing gap
	 * --ml-sidebar-item-trailing-gap: var(--ml-space-2)
	 *
	 * Badge
	 * --ml-sidebar-badge-min-size: 20px
	 * --ml-sidebar-badge-padding-x: var(--ml-space-1-5)
	 * --ml-sidebar-badge-radius: var(--ml-radius-full)
	 * --ml-sidebar-badge-font-size: var(--ml-text-xs)
	 * --ml-sidebar-badge-font-weight: var(--ml-font-medium)
	 * --ml-sidebar-badge-bg: var(--ml-color-surface-tertiary)
	 * --ml-sidebar-badge-color: var(--ml-color-text-secondary)
	 *
	 * Active badge overrides
	 * --ml-sidebar-item-active-badge-bg: var(--ml-sidebar-badge-bg)
	 * --ml-sidebar-item-active-badge-color: var(--ml-sidebar-badge-color)
	 *
	 * Chevron transition
	 * --ml-sidebar-chevron-transition: var(--ml-duration-200) var(--ml-ease-in-out)
	 */

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
		background-color: var(--ml-sidebar-bg, var(--ml-color-surface));
		border-right: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
		transition: width var(--ml-sidebar-transition, var(--ml-duration-200) var(--ml-ease-in-out));
	}

	/* Slim variant - collapsed (icons only) */
	.ml-sidebar--slim {
		--ml-sidebar-width: 64px;
		overflow: hidden;
	}

	/* Slim variant - expanded on hover */
	.ml-sidebar--slim:not(.ml-sidebar--collapsed) {
		--ml-sidebar-width: 280px;
		box-shadow: var(--ml-sidebar-slim-expanded-shadow, var(--ml-shadow-lg));
		z-index: 50;
		position: relative;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-sidebar__header {
		flex-shrink: 0;
		padding: var(--ml-sidebar-header-padding, var(--ml-space-4));
		border-bottom: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
	}

	.ml-sidebar__header:empty {
		display: none;
	}

	/* ============================================
	   SEARCH
	   ============================================ */
	.ml-sidebar__search {
		flex-shrink: 0;
		padding: var(--ml-sidebar-search-padding-y, var(--ml-space-3)) var(--ml-sidebar-search-padding-x, var(--ml-space-4));
	}

	/* ============================================
	   MAIN NAV AREA
	   ============================================ */
	.ml-sidebar__main {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--ml-sidebar-main-padding-y, var(--ml-space-2)) 0;
	}

	/* Scrollbar styling */
	.ml-sidebar__main::-webkit-scrollbar {
		width: var(--ml-sidebar-scrollbar-width, 4px);
	}

	.ml-sidebar__main::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-sidebar__main::-webkit-scrollbar-thumb {
		background-color: var(--ml-sidebar-scrollbar-color, var(--ml-color-border));
		border-radius: var(--ml-sidebar-scrollbar-radius, var(--ml-radius-full));
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-sidebar__footer {
		flex-shrink: 0;
		margin-top: auto;
		border-top: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
	}

	.ml-sidebar__footer-nav {
		padding: var(--ml-sidebar-footer-nav-padding, var(--ml-space-2));
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-footer-nav-gap, var(--ml-space-0-5));
	}

	.ml-sidebar__footer-nav:empty {
		display: none;
	}

	.ml-sidebar__feature {
		padding: var(--ml-sidebar-feature-padding-y, var(--ml-space-3)) var(--ml-sidebar-feature-padding-x, var(--ml-space-4));
	}

	.ml-sidebar__user {
		padding: var(--ml-sidebar-user-padding-y, var(--ml-space-3)) var(--ml-sidebar-user-padding-x, var(--ml-space-4));
		border-top: var(--ml-sidebar-border-width, var(--ml-border)) solid var(--ml-sidebar-border-color, var(--ml-color-border));
	}

	/* ============================================
	   CONFIG-RENDERED GROUPS
	   ============================================ */
	.ml-sidebar__group {
		padding: var(--ml-space-1) 0;
	}

	.ml-sidebar__group-label {
		display: block;
		padding: var(--ml-sidebar-group-label-padding-y, var(--ml-space-2)) var(--ml-sidebar-group-label-padding-x, var(--ml-space-4));
		font-family: var(--ml-sidebar-group-label-font-family, var(--ml-font-sans));
		font-size: var(--ml-sidebar-group-label-font-size, var(--ml-text-xs));
		font-weight: var(--ml-sidebar-group-label-font-weight, var(--ml-font-semibold));
		color: var(--ml-sidebar-group-label-color, var(--ml-color-text-muted));
		text-transform: uppercase;
		letter-spacing: var(--ml-sidebar-group-label-letter-spacing, 0.05em);
		line-height: var(--ml-sidebar-group-label-line-height, var(--ml-leading-tight));
	}

	.ml-sidebar__group-items {
		display: flex;
		flex-direction: column;
		gap: var(--ml-sidebar-group-items-gap, var(--ml-space-0-5));
		padding: 0 var(--ml-sidebar-group-items-padding-x, var(--ml-space-2));
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
		gap: var(--ml-sidebar-item-gap, var(--ml-space-3));
		box-sizing: border-box;
		width: 100%;
		padding: var(--ml-sidebar-item-padding-y, var(--ml-space-2)) var(--ml-sidebar-item-padding-x, var(--ml-space-3));
		padding-left: calc(var(--ml-sidebar-item-padding-x, var(--ml-space-3)) + (var(--level) * var(--ml-space-5)));
		border: none;
		border-left: var(--ml-sidebar-item-active-indicator-width, 0px) solid transparent;
		border-radius: var(--ml-sidebar-item-radius, var(--ml-radius));
		background: transparent;
		color: var(--ml-sidebar-item-color, var(--ml-color-text-secondary));
		font-family: var(--ml-sidebar-item-font-family, var(--ml-font-sans));
		font-size: var(--ml-sidebar-item-font-size, var(--ml-text-sm));
		font-weight: var(--ml-sidebar-item-font-weight, var(--ml-font-medium));
		line-height: var(--ml-sidebar-item-line-height, var(--ml-leading-tight));
		text-align: left;
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out)),
			color var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}

	.ml-sidebar__item-link:hover:not(.ml-sidebar__item-link--disabled):not(.ml-sidebar__item-link--active) {
		background-color: var(--ml-sidebar-item-hover-bg, var(--ml-gray-100));
		color: var(--ml-sidebar-item-hover-color, var(--ml-color-text));
	}

	.ml-sidebar__item-link:focus-visible {
		outline: 2px solid var(--ml-sidebar-item-focus-color, var(--ml-color-primary));
		outline-offset: -2px;
	}

	.ml-sidebar__item-link--active {
		background-color: var(--ml-sidebar-item-active-bg, var(--ml-color-primary));
		color: var(--ml-sidebar-item-active-color, var(--ml-color-text-inverse));
		border-left-color: var(--ml-sidebar-item-active-indicator-color, transparent);
	}

	.ml-sidebar__item-link--active:hover {
		background-color: var(--ml-sidebar-item-active-hover-bg, var(--ml-color-primary-hover));
		color: var(--ml-sidebar-item-active-color, var(--ml-color-text-inverse));
	}

	.ml-sidebar__item-link--disabled {
		color: var(--ml-sidebar-item-disabled-color, var(--ml-color-text-muted));
		cursor: not-allowed;
		opacity: var(--ml-sidebar-item-disabled-opacity, 0.6);
	}

	.ml-sidebar__item-link--collapsed {
		justify-content: center;
		padding: var(--ml-sidebar-item-padding-y, var(--ml-space-2));
	}

	/* Leading area (icon) */
	.ml-sidebar__item-leading {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: var(--ml-sidebar-item-icon-size, 20px);
		height: var(--ml-sidebar-item-icon-size, 20px);
		color: var(--ml-sidebar-item-icon-color, inherit);
	}

	.ml-sidebar__item-link--active .ml-sidebar__item-leading {
		color: var(--ml-sidebar-item-active-icon-color, inherit);
	}

	.ml-sidebar__item-link:hover:not(.ml-sidebar__item-link--disabled):not(.ml-sidebar__item-link--active) .ml-sidebar__item-leading {
		color: var(--ml-sidebar-item-hover-icon-color, inherit);
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
		gap: var(--ml-sidebar-item-trailing-gap, var(--ml-space-2));
		flex-shrink: 0;
	}

	/* Badge */
	.ml-sidebar__item-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--ml-sidebar-badge-min-size, 20px);
		height: var(--ml-sidebar-badge-min-size, 20px);
		padding: 0 var(--ml-sidebar-badge-padding-x, var(--ml-space-1-5));
		border-radius: var(--ml-sidebar-badge-radius, var(--ml-radius-full));
		font-size: var(--ml-sidebar-badge-font-size, var(--ml-text-xs));
		font-weight: var(--ml-sidebar-badge-font-weight, var(--ml-font-medium));
		line-height: 1;
		background-color: var(--ml-sidebar-badge-bg, var(--ml-color-surface-tertiary));
		color: var(--ml-sidebar-badge-color, var(--ml-color-text-secondary));
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

	.ml-sidebar__item-link--active .ml-sidebar__item-badge {
		background-color: var(--ml-sidebar-item-active-badge-bg, var(--ml-sidebar-badge-bg, var(--ml-color-surface-tertiary)));
		color: var(--ml-sidebar-item-active-badge-color, var(--ml-sidebar-badge-color, var(--ml-color-text-secondary)));
	}

	/* Chevron for expandable items */
	.ml-sidebar__item-chevron {
		transition: transform var(--ml-sidebar-chevron-transition, var(--ml-duration-200) var(--ml-ease-in-out));
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
		transition: opacity var(--ml-sidebar-item-transition, var(--ml-duration-150) var(--ml-ease-in-out));
	}
`;
