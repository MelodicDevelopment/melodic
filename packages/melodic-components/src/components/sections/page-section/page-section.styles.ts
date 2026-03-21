import { css } from '@melodicdev/core';

export const pageSectionStyles = () => css`
	:host {
		display: block;
	}

	.ml-page-section__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		margin-bottom: var(--ml-page-section-gap, var(--ml-space-4));
	}

	.ml-page-section__heading {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-page-section__title {
		margin: 0;
		font-family: var(--ml-page-section-title-font, 'Cormorant Garamond', 'Georgia', serif);
		font-size: var(--ml-page-section-title-size, var(--ml-text-2xl));
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-page-section__subtitle {
		margin: 0;
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-normal);
	}

	.ml-page-section__action {
		flex-shrink: 0;
	}

	.ml-page-section__action-link {
		font-family: var(--ml-font-sans);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-primary);
		text-decoration: none;
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-page-section__action-link:hover {
		color: var(--ml-color-primary-hover);
		text-decoration: underline;
	}

	/* Padding variants */
	.ml-page-section--pad-none .ml-page-section__content {
		padding: 0;
	}

	.ml-page-section--pad-sm .ml-page-section__content {
		padding: var(--ml-space-2) 0;
	}

	.ml-page-section--pad-md .ml-page-section__content {
		padding: var(--ml-space-4) 0;
	}

	.ml-page-section--pad-lg .ml-page-section__content {
		padding: var(--ml-space-6) 0;
	}
`;
