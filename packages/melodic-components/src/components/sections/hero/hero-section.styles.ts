import { css } from '@melodicdev/core';

export const heroSectionStyles = () => css`
	:host {
		display: block;
		width: 100%;
	}

	/* ============================================
	   HERO CONTAINER
	   ============================================ */
	.ml-hero {
		position: relative;
		width: 100%;
		font-family: var(--ml-font-sans);
	}

	/* ============================================
	   SIZE VARIANTS (padding & font sizes)
	   ============================================ */
	.ml-hero--sm {
		padding: var(--ml-space-12) var(--ml-space-6);
	}

	.ml-hero--md {
		padding: var(--ml-space-20) var(--ml-space-6);
	}

	.ml-hero--lg {
		padding: calc(var(--ml-space-20) + var(--ml-space-10)) var(--ml-space-6);
	}

	.ml-hero--sm .ml-hero__title,
	.ml-hero--sm ::slotted([slot="title"]) {
		font-size: var(--ml-text-3xl);
		line-height: var(--ml-leading-tight);
	}

	.ml-hero--md .ml-hero__title,
	.ml-hero--md ::slotted([slot="title"]) {
		font-size: var(--ml-text-4xl);
		line-height: var(--ml-leading-tight);
	}

	.ml-hero--lg .ml-hero__title,
	.ml-hero--lg ::slotted([slot="title"]) {
		font-size: var(--ml-text-5xl);
		line-height: var(--ml-leading-tight);
	}

	.ml-hero--sm .ml-hero__description,
	.ml-hero--sm ::slotted([slot="description"]) {
		font-size: var(--ml-text-base);
	}

	.ml-hero--md .ml-hero__description,
	.ml-hero--md ::slotted([slot="description"]) {
		font-size: var(--ml-text-lg);
	}

	.ml-hero--lg .ml-hero__description,
	.ml-hero--lg ::slotted([slot="description"]) {
		font-size: var(--ml-text-xl);
	}

	/* ============================================
	   BACKGROUND VARIANTS
	   ============================================ */
	.ml-hero--bg-subtle {
		background-color: var(--ml-color-surface-secondary);
	}

	.ml-hero--bg-gradient {
		background: linear-gradient(
			135deg,
			var(--ml-color-primary-subtle) 0%,
			var(--ml-color-surface) 50%,
			var(--ml-color-success-subtle, var(--ml-color-surface-secondary)) 100%
		);
	}

	/* ============================================
	   LAYOUT: CONTAINER
	   ============================================ */
	.ml-hero__container {
		max-width: var(--ml-container-xl, 1280px);
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
		max-width: 800px;
	}

	.ml-hero--centered .ml-hero__media--below {
		margin-top: var(--ml-space-10);
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
		gap: var(--ml-space-12);
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
		margin-bottom: var(--ml-space-4);
		font-size: var(--ml-text-sm);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-color-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Title */
	.ml-hero__title,
	::slotted([slot="title"]) {
		margin: 0 0 var(--ml-space-4) 0;
		font-weight: var(--ml-font-bold);
		color: var(--ml-color-text);
		letter-spacing: -0.025em;
	}

	/* Description */
	.ml-hero__description,
	::slotted([slot="description"]) {
		margin: 0 0 var(--ml-space-8) 0;
		color: var(--ml-color-text-secondary);
		line-height: var(--ml-leading-relaxed);
		max-width: 640px;
	}

	/* Actions */
	.ml-hero__actions {
		display: flex;
		gap: var(--ml-space-3);
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
		border-radius: var(--ml-radius-lg);
	}

	/* Social proof */
	.ml-hero__social-proof {
		margin-top: var(--ml-space-10);
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
