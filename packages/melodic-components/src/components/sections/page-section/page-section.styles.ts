import { css } from '@melodicdev/core';

export const pageSectionStyles = () => css`
	:host {
		display: block;

		/* Header spacing */
		--ml-page-section-gap: var(--ml-space-4);
		--ml-page-section-heading-gap: var(--ml-space-1);

		/* Title */
		--ml-page-section-title-font: 'Cormorant Garamond', 'Georgia', serif;
		--ml-page-section-title-size: var(--ml-text-2xl);
		--ml-page-section-title-weight: var(--ml-font-semibold);
		--ml-page-section-title-color: var(--ml-color-text);
		--ml-page-section-title-line-height: var(--ml-leading-tight);

		/* Subtitle */
		--ml-page-section-subtitle-font: var(--ml-font-sans);
		--ml-page-section-subtitle-size: var(--ml-text-sm);
		--ml-page-section-subtitle-color: var(--ml-color-text-muted);
		--ml-page-section-subtitle-line-height: var(--ml-leading-normal);

		/* Action link */
		--ml-page-section-action-font: var(--ml-font-sans);
		--ml-page-section-action-size: var(--ml-text-sm);
		--ml-page-section-action-weight: var(--ml-font-medium);
		--ml-page-section-action-color: var(--ml-color-primary);
		--ml-page-section-action-hover-color: var(--ml-color-primary-hover);
		--ml-page-section-action-transition: var(--ml-duration-150);

		/* Content padding variants */
		--ml-page-section-pad-sm: var(--ml-space-2) 0;
		--ml-page-section-pad-md: var(--ml-space-4) 0;
		--ml-page-section-pad-lg: var(--ml-space-6) 0;
	}

	.ml-page-section__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-page-section-gap);
		margin-bottom: var(--ml-page-section-gap);
	}

	.ml-page-section__heading {
		display: flex;
		flex-direction: column;
		gap: var(--ml-page-section-heading-gap);
	}

	.ml-page-section__title {
		margin: 0;
		font-family: var(--ml-page-section-title-font);
		font-size: var(--ml-page-section-title-size);
		font-weight: var(--ml-page-section-title-weight);
		color: var(--ml-page-section-title-color);
		line-height: var(--ml-page-section-title-line-height);
	}

	.ml-page-section__subtitle {
		margin: 0;
		font-family: var(--ml-page-section-subtitle-font);
		font-size: var(--ml-page-section-subtitle-size);
		color: var(--ml-page-section-subtitle-color);
		line-height: var(--ml-page-section-subtitle-line-height);
	}

	.ml-page-section__action {
		flex-shrink: 0;
	}

	.ml-page-section__action-link {
		font-family: var(--ml-page-section-action-font);
		font-size: var(--ml-page-section-action-size);
		font-weight: var(--ml-page-section-action-weight);
		color: var(--ml-page-section-action-color);
		text-decoration: none;
		transition: color var(--ml-page-section-action-transition) var(--ml-ease-in-out);
	}

	.ml-page-section__action-link:hover {
		color: var(--ml-page-section-action-hover-color);
		text-decoration: underline;
	}

	/* Padding variants */
	.ml-page-section--pad-none .ml-page-section__content {
		padding: 0;
	}

	.ml-page-section--pad-sm .ml-page-section__content {
		padding: var(--ml-page-section-pad-sm);
	}

	.ml-page-section--pad-md .ml-page-section__content {
		padding: var(--ml-page-section-pad-md);
	}

	.ml-page-section--pad-lg .ml-page-section__content {
		padding: var(--ml-page-section-pad-lg);
	}
`;
