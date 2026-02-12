export const authLayoutCss = `
	/* ============================================
	   AUTH LAYOUT - SHARED STYLES
	   ============================================ */
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
		font-family: var(--ml-font-sans);
		background-color: var(--ml-color-surface-secondary);
	}

	/* ============================================
	   CENTERED VARIANT
	   ============================================ */
	.ml-auth--centered {
		align-items: center;
		justify-content: center;
		padding: var(--ml-space-6);
	}

	.ml-auth--centered .ml-auth__card {
		width: 100%;
		max-width: 440px;
		background-color: var(--ml-color-surface);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-xl);
		box-shadow: var(--ml-shadow-lg);
		padding: var(--ml-space-10);
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
		padding: var(--ml-space-10);
		background-color: var(--ml-color-surface);
	}

	.ml-auth--split .ml-auth__card {
		width: 100%;
		max-width: 440px;
	}

	.ml-auth--split .ml-auth__brand-side {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: var(--ml-space-10);
		background-color: var(--ml-color-primary);
		color: var(--ml-color-text-inverse);
		position: relative;
		overflow: hidden;
	}

	.ml-auth__brand-content {
		position: relative;
		z-index: 1;
		text-align: center;
		max-width: 480px;
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
		margin-bottom: var(--ml-space-6);
	}

	.ml-auth__logo:empty {
		display: none;
	}

	/* ============================================
	   HEADER
	   ============================================ */
	.ml-auth__header {
		text-align: center;
		margin-bottom: var(--ml-space-8);
	}

	.ml-auth__title {
		margin: 0 0 var(--ml-space-2) 0;
		font-size: var(--ml-text-2xl);
		font-weight: var(--ml-font-bold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-auth__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-normal);
	}

	/* ============================================
	   FORM AREA
	   ============================================ */
	.ml-auth__form {
		margin-bottom: var(--ml-space-6);
	}

	.ml-auth__form:empty {
		display: none;
	}

	/* ============================================
	   SOCIAL LOGIN
	   ============================================ */
	.ml-auth__social {
		margin-bottom: var(--ml-space-6);
	}

	.ml-auth__social:empty {
		display: none;
	}

	/* ============================================
	   FOOTER
	   ============================================ */
	.ml-auth__footer {
		text-align: center;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
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
			padding: var(--ml-space-6);
		}
	}
`;
