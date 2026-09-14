import { css } from '@melodicdev/core';

export const pageSectionStyles = () => css`
	/*
	 * Tokens. Rules read each one with its default as the var() fallback,
	 * so a value set on the element or inherited from any ancestor wins.
	 *
	 * Header spacing
	 * --ml-page-section-gap: var(--ml-space-4)
	 * --ml-page-section-heading-gap: var(--ml-space-1)
	 *
	 * Title
	 * --ml-page-section-title-font: 'Cormorant Garamond', 'Georgia', serif
	 * --ml-page-section-title-size: var(--ml-text-2xl)
	 * --ml-page-section-title-weight: var(--ml-font-semibold)
	 * --ml-page-section-title-color: var(--ml-color-text)
	 * --ml-page-section-title-line-height: var(--ml-leading-tight)
	 *
	 * Subtitle
	 * --ml-page-section-subtitle-font: var(--ml-font-sans)
	 * --ml-page-section-subtitle-size: var(--ml-text-sm)
	 * --ml-page-section-subtitle-color: var(--ml-color-text-muted)
	 * --ml-page-section-subtitle-line-height: var(--ml-leading-normal)
	 *
	 * Action link
	 * --ml-page-section-action-font: var(--ml-font-sans)
	 * --ml-page-section-action-size: var(--ml-text-sm)
	 * --ml-page-section-action-weight: var(--ml-font-medium)
	 * --ml-page-section-action-color: var(--ml-color-primary)
	 * --ml-page-section-action-hover-color: var(--ml-color-primary-hover)
	 * --ml-page-section-action-transition: var(--ml-duration-150)
	 *
	 * Content padding variants
	 * --ml-page-section-pad-sm: var(--ml-space-2) 0
	 * --ml-page-section-pad-md: var(--ml-space-4) 0
	 * --ml-page-section-pad-lg: var(--ml-space-6) 0
	 */

	:host {
		display: block;
	}

	.ml-page-section__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-page-section-gap, var(--ml-space-4));
		margin-bottom: var(--ml-page-section-gap, var(--ml-space-4));
	}

	/* Header is always rendered (so the action slot's slotchange can fire);
	   an empty header is hidden instead of omitted. */
	.ml-page-section__header--hidden {
		display: none;
	}

	.ml-page-section__heading {
		display: flex;
		flex-direction: column;
		gap: var(--ml-page-section-heading-gap, var(--ml-space-1));
	}

	.ml-page-section__title {
		margin: 0;
		font-family: var(--ml-page-section-title-font, 'Cormorant Garamond', 'Georgia', serif);
		font-size: var(--ml-page-section-title-size, var(--ml-text-2xl));
		font-weight: var(--ml-page-section-title-weight, var(--ml-font-semibold));
		color: var(--ml-page-section-title-color, var(--ml-color-text));
		line-height: var(--ml-page-section-title-line-height, var(--ml-leading-tight));
	}

	.ml-page-section__subtitle {
		margin: 0;
		font-family: var(--ml-page-section-subtitle-font, var(--ml-font-sans));
		font-size: var(--ml-page-section-subtitle-size, var(--ml-text-sm));
		color: var(--ml-page-section-subtitle-color, var(--ml-color-text-muted));
		line-height: var(--ml-page-section-subtitle-line-height, var(--ml-leading-normal));
	}

	.ml-page-section__action {
		flex-shrink: 0;
	}

	.ml-page-section__action-link {
		font-family: var(--ml-page-section-action-font, var(--ml-font-sans));
		font-size: var(--ml-page-section-action-size, var(--ml-text-sm));
		font-weight: var(--ml-page-section-action-weight, var(--ml-font-medium));
		color: var(--ml-page-section-action-color, var(--ml-color-primary));
		text-decoration: none;
		transition: color var(--ml-page-section-action-transition, var(--ml-duration-150)) var(--ml-ease-in-out);
	}

	.ml-page-section__action-link:hover {
		color: var(--ml-page-section-action-hover-color, var(--ml-color-primary-hover));
		text-decoration: underline;
	}

	/* Padding variants */
	.ml-page-section--pad-none .ml-page-section__content {
		padding: 0;
	}

	.ml-page-section--pad-sm .ml-page-section__content {
		padding: var(--ml-page-section-pad-sm, var(--ml-space-2) 0);
	}

	.ml-page-section--pad-md .ml-page-section__content {
		padding: var(--ml-page-section-pad-md, var(--ml-space-4) 0);
	}

	.ml-page-section--pad-lg .ml-page-section__content {
		padding: var(--ml-page-section-pad-lg, var(--ml-space-6) 0);
	}
`;
