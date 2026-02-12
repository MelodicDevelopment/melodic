import { css } from '@melodicdev/core';

export const pageHeaderStyles = () => css`
	:host {
		display: block;
	}

	/* ============================================
	   PAGE HEADER CONTAINER
	   ============================================ */
	.ml-page-header {
		padding: var(--ml-space-6) var(--ml-space-6) var(--ml-space-4);
		font-family: var(--ml-font-sans);
	}

	.ml-page-header--divider {
		border-bottom: var(--ml-border) solid var(--ml-color-border);
	}

	/* ============================================
	   COMPACT VARIANT
	   ============================================ */
	.ml-page-header--compact {
		padding: var(--ml-space-4) var(--ml-space-6) var(--ml-space-3);
	}

	.ml-page-header--compact .ml-page-header__title h1 {
		font-size: var(--ml-text-lg);
	}

	/* ============================================
	   CENTERED VARIANT
	   ============================================ */
	.ml-page-header--centered {
		text-align: center;
	}

	.ml-page-header--centered .ml-page-header__main {
		flex-direction: column;
		align-items: center;
	}

	.ml-page-header--centered .ml-page-header__content {
		align-items: center;
	}

	.ml-page-header--centered .ml-page-header__actions {
		margin-top: var(--ml-space-4);
	}

	.ml-page-header--centered .ml-page-header__breadcrumb {
		justify-content: center;
	}

	/* ============================================
	   BREADCRUMB
	   ============================================ */
	.ml-page-header__breadcrumb {
		display: flex;
		margin-bottom: var(--ml-space-3);
	}

	/* ============================================
	   MAIN (title row + actions)
	   ============================================ */
	.ml-page-header__main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
	}

	/* ============================================
	   CONTENT (title + description + meta)
	   ============================================ */
	.ml-page-header__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
		min-width: 0;
		flex: 1;
	}

	/* ============================================
	   TITLE
	   ============================================ */
	.ml-page-header__title h1 {
		margin: 0;
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-font-semibold);
		line-height: var(--ml-leading-tight);
		color: var(--ml-color-text);
	}

	.ml-page-header__title ::slotted(*) {
		margin: 0;
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-font-semibold);
		line-height: var(--ml-leading-tight);
		color: var(--ml-color-text);
	}

	/* ============================================
	   DESCRIPTION
	   ============================================ */
	.ml-page-header__description p {
		margin: 0;
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-normal);
		color: var(--ml-color-text-secondary);
	}

	.ml-page-header__description ::slotted(*) {
		margin: 0;
		font-size: var(--ml-text-sm);
		line-height: var(--ml-leading-normal);
		color: var(--ml-color-text-secondary);
	}

	/* ============================================
	   META
	   ============================================ */
	.ml-page-header__meta {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		margin-top: var(--ml-space-2);
	}

	/* ============================================
	   ACTIONS
	   ============================================ */
	.ml-page-header__actions {
		display: flex;
		align-items: center;
		gap: var(--ml-space-2);
		flex-shrink: 0;
	}

	/* ============================================
	   TABS
	   ============================================ */
	.ml-page-header__tabs {
		margin-top: var(--ml-space-4);
	}

	/* ============================================
	   RESPONSIVE
	   ============================================ */
	@media (max-width: 640px) {
		.ml-page-header {
			padding: var(--ml-space-4);
		}

		.ml-page-header__main {
			flex-direction: column;
		}

		.ml-page-header__actions {
			width: 100%;
		}

		.ml-page-header__actions ::slotted(*) {
			flex: 1;
		}
	}
`;
