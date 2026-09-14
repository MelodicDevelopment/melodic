export const authLayoutCss = `
	/* ============================================
	   AUTH LAYOUT - SHARED STYLES
	   ============================================ */
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Background
	 * --ml-auth-bg: var(--ml-color-surface-secondary)
	 *
	 * Font
	 * --ml-auth-font-family: var(--ml-font-sans)
	 *
	 * Card
	 * --ml-auth-card-max-width: 440px
	 * --ml-auth-card-bg: var(--ml-color-surface)
	 * --ml-auth-card-border-width: var(--ml-border)
	 * --ml-auth-card-border-color: var(--ml-color-border)
	 * --ml-auth-card-radius: var(--ml-radius-xl)
	 * --ml-auth-card-shadow: var(--ml-shadow-lg)
	 * --ml-auth-card-padding: var(--ml-space-10)
	 *
	 * Centered variant
	 * --ml-auth-centered-padding: var(--ml-space-6)
	 *
	 * Split variant
	 * --ml-auth-split-padding: var(--ml-space-10)
	 * --ml-auth-split-form-padding: var(--ml-auth-split-padding)
	 * --ml-auth-split-brand-padding: var(--ml-auth-split-padding)
	 * --ml-auth-split-form-bg: var(--ml-color-surface)
	 * --ml-auth-split-brand-bg: var(--ml-color-primary)
	 * --ml-auth-split-brand-color: var(--ml-color-text-inverse)
	 * --ml-auth-split-brand-max-width: 480px
	 *
	 * Logo
	 * --ml-auth-logo-margin: var(--ml-space-6)
	 *
	 * Header
	 * --ml-auth-header-margin: var(--ml-space-8)
	 * --ml-auth-title-size: var(--ml-text-2xl)
	 * --ml-auth-title-weight: var(--ml-font-bold)
	 * --ml-auth-title-color: var(--ml-color-text)
	 * --ml-auth-title-line-height: var(--ml-leading-tight)
	 * --ml-auth-title-margin: var(--ml-space-2)
	 * --ml-auth-description-size: var(--ml-text-sm)
	 * --ml-auth-description-color: var(--ml-color-text-muted)
	 * --ml-auth-description-line-height: var(--ml-leading-normal)
	 *
	 * Form / Social / Footer spacing
	 * --ml-auth-form-margin: var(--ml-space-6)
	 * --ml-auth-social-margin: var(--ml-space-6)
	 * --ml-auth-footer-size: var(--ml-text-sm)
	 * --ml-auth-footer-color: var(--ml-color-text-muted)
	 *
	 * Mobile
	 * --ml-auth-mobile-padding: var(--ml-space-6)
	 */

	:host {
		display: block;
		width: 100%;
		height: 100%;
	}

	/* ============================================
	   BASE WRAPPER
	   ============================================ */
	.ml-auth {
		display: flex;
		min-height: 100%;
		height: 100%;
		font-family: var(--ml-auth-font-family, var(--ml-font-sans));
		background-color: var(--ml-auth-bg, var(--ml-color-surface-secondary));
	}

	/* ============================================
	   CENTERED VARIANT
	   ============================================ */
	.ml-auth--centered {
		align-items: center;
		justify-content: center;
		padding: var(--ml-auth-centered-padding, var(--ml-space-6));
	}

	.ml-auth--centered .ml-auth__card {
		width: 100%;
		max-width: var(--ml-auth-card-max-width, 440px);
		background-color: var(--ml-auth-card-bg, var(--ml-color-surface));
		border: var(--ml-auth-card-border-width, var(--ml-border)) solid var(--ml-auth-card-border-color, var(--ml-color-border));
		border-radius: var(--ml-auth-card-radius, var(--ml-radius-xl));
		box-shadow: var(--ml-auth-card-shadow, var(--ml-shadow-lg));
		padding: var(--ml-auth-card-padding, var(--ml-space-10));
	}

	/* ============================================
	   SPLIT VARIANT
	   ============================================ */
	.ml-auth--split {
		flex-direction: row;
	}

	.ml-auth--split .ml-auth__form-side {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: var(--ml-auth-split-form-padding, var(--ml-auth-split-padding, var(--ml-space-10)));
		background-color: var(--ml-auth-split-form-bg, var(--ml-color-surface));
	}

	.ml-auth--split .ml-auth__card {
		width: 100%;
		max-width: var(--ml-auth-card-max-width, 440px);
	}

	.ml-auth--split .ml-auth__brand-side {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: var(--ml-auth-split-brand-padding, var(--ml-auth-split-padding, var(--ml-space-10)));
		background-color: var(--ml-auth-split-brand-bg, var(--ml-color-primary));
		color: var(--ml-auth-split-brand-color, var(--ml-color-text-inverse));
		position: relative;
		overflow: hidden;
	}

	.ml-auth__brand-content {
		position: relative;
		z-index: 1;
		text-align: center;
		width: 100%;
		height: 100%;
		max-width: var(--ml-auth-split-brand-max-width, 480px);
	}

	.ml-auth__brand-content ::slotted(*) {
		color: inherit;
	}

	/* ============================================
	   LOGO AREA
	   ============================================ */
	.ml-auth__logo {
		display: flex;
		justify-content: center;
		margin-bottom: var(--ml-auth-logo-margin, var(--ml-space-6));
	}

	.ml-auth__logo:empty {
		display: none;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-auth__header {
		text-align: center;
		margin-bottom: var(--ml-auth-header-margin, var(--ml-space-8));
	}

	.ml-auth__title {
		margin: 0 0 var(--ml-auth-title-margin, var(--ml-space-2)) 0;
		font-size: var(--ml-auth-title-size, var(--ml-text-2xl));
		font-weight: var(--ml-auth-title-weight, var(--ml-font-bold));
		color: var(--ml-auth-title-color, var(--ml-color-text));
		line-height: var(--ml-auth-title-line-height, var(--ml-leading-tight));
	}

	.ml-auth__description {
		margin: 0;
		font-size: var(--ml-auth-description-size, var(--ml-text-sm));
		color: var(--ml-auth-description-color, var(--ml-color-text-muted));
		line-height: var(--ml-auth-description-line-height, var(--ml-leading-normal));
	}

	/* ============================================
	   FORM AREA
	   ============================================ */
	.ml-auth__form {
		margin-bottom: var(--ml-auth-form-margin, var(--ml-space-6));
	}

	.ml-auth__form:empty {
		display: none;
	}

	/* ============================================
	   SOCIAL LOGIN
	   ============================================ */
	.ml-auth__social {
		margin-bottom: var(--ml-auth-social-margin, var(--ml-space-6));
	}

	.ml-auth__social:empty {
		display: none;
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-auth__footer {
		text-align: center;
		font-size: var(--ml-auth-footer-size, var(--ml-text-sm));
		color: var(--ml-auth-footer-color, var(--ml-color-text-muted));
	}

	.ml-auth__footer:empty {
		display: none;
	}

	/* ============================================
	   RESPONSIVE - SPLIT COLLAPSE
	   ============================================ */
	@media (max-width: 768px) {
		.ml-auth--split {
			flex-direction: column;
		}

		.ml-auth--split .ml-auth__brand-side {
			display: none;
		}

		.ml-auth--split .ml-auth__form-side {
			min-height: 100%;
			padding: var(--ml-auth-mobile-padding, var(--ml-space-6));
		}
	}
`;
