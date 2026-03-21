import { css } from '@melodicdev/core';

export const heroSectionStyles = () => css`
	:host {
		display: block;
		width: 100%;

		/* Font */
		--ml-hero-font-family: var(--ml-font-sans);

		/* Size: sm */
		--ml-hero-sm-padding: var(--ml-space-12) var(--ml-space-6);
		--ml-hero-sm-title-size: var(--ml-text-3xl);
		--ml-hero-sm-description-size: var(--ml-text-base);

		/* Size: md */
		--ml-hero-md-padding: var(--ml-space-20) var(--ml-space-6);
		--ml-hero-md-title-size: var(--ml-text-4xl);
		--ml-hero-md-description-size: var(--ml-text-lg);

		/* Size: lg */
		--ml-hero-lg-padding: calc(var(--ml-space-20) + var(--ml-space-10)) var(--ml-space-6);
		--ml-hero-lg-title-size: var(--ml-text-5xl);
		--ml-hero-lg-description-size: var(--ml-text-xl);

		/* Background variants */
		--ml-hero-bg-subtle: var(--ml-color-surface-secondary);
		--ml-hero-bg-gradient: linear-gradient(
			135deg,
			var(--ml-color-primary-subtle) 0%,
			var(--ml-color-surface) 50%,
			var(--ml-color-success-subtle, var(--ml-color-surface-secondary)) 100%
		);

		/* Container */
		--ml-hero-container-max-width: var(--ml-container-xl, 1280px);
		--ml-hero-content-max-width: 800px;
		--ml-hero-split-gap: var(--ml-space-12);

		/* Eyebrow */
		--ml-hero-eyebrow-margin-bottom: var(--ml-space-4);
		--ml-hero-eyebrow-font-size: var(--ml-text-sm);
		--ml-hero-eyebrow-font-weight: var(--ml-font-semibold);
		--ml-hero-eyebrow-color: var(--ml-color-primary);
		--ml-hero-eyebrow-letter-spacing: 0.05em;

		/* Title */
		--ml-hero-title-margin-bottom: var(--ml-space-4);
		--ml-hero-title-font-weight: var(--ml-font-bold);
		--ml-hero-title-color: var(--ml-color-text);
		--ml-hero-title-letter-spacing: -0.025em;
		--ml-hero-title-line-height: var(--ml-leading-tight);

		/* Description */
		--ml-hero-description-margin-bottom: var(--ml-space-8);
		--ml-hero-description-color: var(--ml-color-text-secondary);
		--ml-hero-description-line-height: var(--ml-leading-relaxed);
		--ml-hero-description-max-width: 640px;

		/* Actions */
		--ml-hero-actions-gap: var(--ml-space-3);

		/* Media */
		--ml-hero-media-radius: var(--ml-radius-lg);
		--ml-hero-media-below-margin: var(--ml-space-10);

		/* Social proof */
		--ml-hero-social-proof-margin: var(--ml-space-10);
	}

	/* ============================================
	   HERO CONTAINER
	   ============================================ */
	.ml-hero {
		position: relative;
		width: 100%;
		font-family: var(--ml-hero-font-family);
	}

	/* ============================================
	   SIZE VARIANTS (padding & font sizes)
	   ============================================ */
	.ml-hero--sm {
		padding: var(--ml-hero-sm-padding);
	}

	.ml-hero--md {
		padding: var(--ml-hero-md-padding);
	}

	.ml-hero--lg {
		padding: var(--ml-hero-lg-padding);
	}

	.ml-hero--sm .ml-hero__title,
	.ml-hero--sm ::slotted([slot="title"]) {
		font-size: var(--ml-hero-sm-title-size);
		line-height: var(--ml-hero-title-line-height);
	}

	.ml-hero--md .ml-hero__title,
	.ml-hero--md ::slotted([slot="title"]) {
		font-size: var(--ml-hero-md-title-size);
		line-height: var(--ml-hero-title-line-height);
	}

	.ml-hero--lg .ml-hero__title,
	.ml-hero--lg ::slotted([slot="title"]) {
		font-size: var(--ml-hero-lg-title-size);
		line-height: var(--ml-hero-title-line-height);
	}

	.ml-hero--sm .ml-hero__description,
	.ml-hero--sm ::slotted([slot="description"]) {
		font-size: var(--ml-hero-sm-description-size);
	}

	.ml-hero--md .ml-hero__description,
	.ml-hero--md ::slotted([slot="description"]) {
		font-size: var(--ml-hero-md-description-size);
	}

	.ml-hero--lg .ml-hero__description,
	.ml-hero--lg ::slotted([slot="description"]) {
		font-size: var(--ml-hero-lg-description-size);
	}

	/* ============================================
	   BACKGROUND VARIANTS
	   ============================================ */
	.ml-hero--bg-subtle {
		background-color: var(--ml-hero-bg-subtle);
	}

	.ml-hero--bg-gradient {
		background: var(--ml-hero-bg-gradient);
	}

	/* ============================================
	   LAYOUT: CONTAINER
	   ============================================ */
	.ml-hero__container {
		max-width: var(--ml-hero-container-max-width);
		margin: 0 auto;
		width: 100%;
	}

	/* ============================================
	   LAYOUT: CENTERED
	   ============================================ */
	.ml-hero--centered .ml-hero__container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.ml-hero--centered .ml-hero__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: var(--ml-hero-content-max-width);
	}

	.ml-hero--centered .ml-hero__media--below {
		margin-top: var(--ml-hero-media-below-margin);
		width: 100%;
		display: flex;
		justify-content: center;
	}

	/* ============================================
	   LAYOUT: SPLIT
	   ============================================ */
	.ml-hero--split .ml-hero__container,
	.ml-hero--split-reverse .ml-hero__container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--ml-hero-split-gap);
		align-items: center;
	}

	.ml-hero--split-reverse .ml-hero__content {
		order: 2;
	}

	.ml-hero--split-reverse .ml-hero__media {
		order: 1;
	}

	.ml-hero--split .ml-hero__content,
	.ml-hero--split-reverse .ml-hero__content {
		display: flex;
		flex-direction: column;
	}

	/* ============================================
	   CONTENT ELEMENTS
	   ============================================ */

	/* Eyebrow */
	::slotted([slot="eyebrow"]) {
		display: inline-block;
		margin-bottom: var(--ml-hero-eyebrow-margin-bottom);
		font-size: var(--ml-hero-eyebrow-font-size);
		font-weight: var(--ml-hero-eyebrow-font-weight);
		color: var(--ml-hero-eyebrow-color);
		text-transform: uppercase;
		letter-spacing: var(--ml-hero-eyebrow-letter-spacing);
	}

	/* Title */
	.ml-hero__title,
	::slotted([slot="title"]) {
		margin: 0 0 var(--ml-hero-title-margin-bottom) 0;
		font-weight: var(--ml-hero-title-font-weight);
		color: var(--ml-hero-title-color);
		letter-spacing: var(--ml-hero-title-letter-spacing);
	}

	/* Description */
	.ml-hero__description,
	::slotted([slot="description"]) {
		margin: 0 0 var(--ml-hero-description-margin-bottom) 0;
		color: var(--ml-hero-description-color);
		line-height: var(--ml-hero-description-line-height);
		max-width: var(--ml-hero-description-max-width);
	}

	/* Actions */
	.ml-hero__actions {
		display: flex;
		gap: var(--ml-hero-actions-gap);
		flex-wrap: wrap;
	}

	.ml-hero--centered .ml-hero__actions {
		justify-content: center;
	}

	.ml-hero__actions:empty {
		display: none;
	}

	/* Media */
	.ml-hero__media {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.ml-hero__media:empty {
		display: none;
	}

	::slotted([slot="media"]) {
		max-width: 100%;
		height: auto;
		border-radius: var(--ml-hero-media-radius);
	}

	/* Social proof */
	.ml-hero__social-proof {
		margin-top: var(--ml-hero-social-proof-margin);
		width: 100%;
	}

	.ml-hero--centered .ml-hero__social-proof {
		text-align: center;
	}

	.ml-hero__social-proof:empty {
		display: none;
	}

	/* ============================================
	   RESPONSIVE: collapse split to stacked
	   ============================================ */
	@media (max-width: 768px) {
		.ml-hero--split .ml-hero__container,
		.ml-hero--split-reverse .ml-hero__container {
			grid-template-columns: 1fr;
		}

		.ml-hero--split .ml-hero__content,
		.ml-hero--split-reverse .ml-hero__content {
			order: 1;
			text-align: center;
			align-items: center;
		}

		.ml-hero--split .ml-hero__media,
		.ml-hero--split-reverse .ml-hero__media {
			order: 2;
		}

		.ml-hero--split .ml-hero__actions,
		.ml-hero--split-reverse .ml-hero__actions {
			justify-content: center;
		}

		.ml-hero--lg {
			padding: var(--ml-space-16) var(--ml-space-4);
		}

		.ml-hero--md {
			padding: var(--ml-space-12) var(--ml-space-4);
		}

		.ml-hero--sm {
			padding: var(--ml-space-8) var(--ml-space-4);
		}

		.ml-hero--lg .ml-hero__title,
		.ml-hero--lg ::slotted([slot="title"]) {
			font-size: var(--ml-text-3xl);
		}

		.ml-hero--md .ml-hero__title,
		.ml-hero--md ::slotted([slot="title"]) {
			font-size: var(--ml-text-2xl);
		}
	}
`;
