import { css } from '@melodicdev/core';

export const pageHeaderStyles = () => css`
	:host {
		display: block;

		/* Padding */
		--ml-page-header-padding: var(--ml-space-6) var(--ml-space-6) var(--ml-space-4);
		--ml-page-header-compact-padding: var(--ml-space-4) var(--ml-space-6) var(--ml-space-3);
		--ml-page-header-mobile-padding: var(--ml-space-4);

		/* Font */
		--ml-page-header-font-family: var(--ml-font-sans);

		/* Border */
		--ml-page-header-border-width: var(--ml-border);
		--ml-page-header-border-color: var(--ml-color-border);

		/* Title */
		--ml-page-header-title-size: var(--ml-text-2xl);
		--ml-page-header-title-weight: var(--ml-font-semibold);
		--ml-page-header-title-line-height: var(--ml-leading-tight);
		--ml-page-header-title-color: var(--ml-color-text);
		--ml-page-header-compact-title-size: var(--ml-text-lg);

		/* Description */
		--ml-page-header-description-size: var(--ml-text-sm);
		--ml-page-header-description-line-height: var(--ml-leading-normal);
		--ml-page-header-description-color: var(--ml-color-text-secondary);

		/* Spacing */
		--ml-page-header-breadcrumb-margin: var(--ml-space-3);
		--ml-page-header-main-gap: var(--ml-space-4);
		--ml-page-header-content-gap: var(--ml-space-1);
		--ml-page-header-meta-gap: var(--ml-space-2);
		--ml-page-header-meta-margin: var(--ml-space-2);
		--ml-page-header-actions-gap: var(--ml-space-2);
		--ml-page-header-centered-actions-margin: var(--ml-space-4);
		--ml-page-header-tabs-margin: var(--ml-space-4);
	}

	/* ============================================
	   PAGE HEADER CONTAINER
	   ============================================ */
	.ml-page-header {
		padding: var(--ml-page-header-padding);
		font-family: var(--ml-page-header-font-family);
	}

	.ml-page-header--divider {
		border-bottom: var(--ml-page-header-border-width) solid var(--ml-page-header-border-color);
	}

	/* ============================================
	   COMPACT VARIANT
	   ============================================ */
	.ml-page-header--compact {
		padding: var(--ml-page-header-compact-padding);
	}

	.ml-page-header--compact .ml-page-header__title h1 {
		font-size: var(--ml-page-header-compact-title-size);
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
		margin-top: var(--ml-page-header-centered-actions-margin);
	}

	.ml-page-header--centered .ml-page-header__breadcrumb {
		justify-content: center;
	}

	/* ============================================
	   BREADCRUMB
	   ============================================ */
	.ml-page-header__breadcrumb {
		display: flex;
		margin-bottom: var(--ml-page-header-breadcrumb-margin);
	}

	/* ============================================
	   MAIN (title row + actions)
	   ============================================ */
	.ml-page-header__main {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-page-header-main-gap);
	}

	/* ============================================
	   CONTENT (title + description + meta)
	   ============================================ */
	.ml-page-header__content {
		display: flex;
		flex-direction: column;
		gap: var(--ml-page-header-content-gap);
		min-width: 0;
		flex: 1;
	}

	/* ============================================
	   TITLE
	   ============================================ */
	.ml-page-header__title h1 {
		margin: 0;
		font-size: var(--ml-page-header-title-size);
		font-weight: var(--ml-page-header-title-weight);
		line-height: var(--ml-page-header-title-line-height);
		color: var(--ml-page-header-title-color);
	}

	.ml-page-header__title ::slotted(*) {
		margin: 0;
		font-size: var(--ml-page-header-title-size);
		font-weight: var(--ml-page-header-title-weight);
		line-height: var(--ml-page-header-title-line-height);
		color: var(--ml-page-header-title-color);
	}

	/* ============================================
	   DESCRIPTION
	   ============================================ */
	.ml-page-header__description p {
		margin: 0;
		font-size: var(--ml-page-header-description-size);
		line-height: var(--ml-page-header-description-line-height);
		color: var(--ml-page-header-description-color);
	}

	.ml-page-header__description ::slotted(*) {
		margin: 0;
		font-size: var(--ml-page-header-description-size);
		line-height: var(--ml-page-header-description-line-height);
		color: var(--ml-page-header-description-color);
	}

	/* ============================================
	   META
	   ============================================ */
	.ml-page-header__meta {
		display: flex;
		align-items: center;
		gap: var(--ml-page-header-meta-gap);
		margin-top: var(--ml-page-header-meta-margin);
	}

	/* ============================================
	   ACTIONS
	   ============================================ */
	.ml-page-header__actions {
		display: flex;
		align-items: center;
		gap: var(--ml-page-header-actions-gap);
		flex-shrink: 0;
	}

	/* ============================================
	   TABS
	   ============================================ */
	.ml-page-header__tabs {
		margin-top: var(--ml-page-header-tabs-margin);
	}

	/* ============================================
	   RESPONSIVE
	   ============================================ */
	@media (max-width: 640px) {
		.ml-page-header {
			padding: var(--ml-page-header-mobile-padding);
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
