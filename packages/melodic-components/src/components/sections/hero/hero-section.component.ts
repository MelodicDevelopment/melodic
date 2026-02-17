import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { heroSectionTemplate } from './hero-section.template.js';
import { heroSectionStyles } from './hero-section.styles.js';

export type HeroVariant = 'centered' | 'split' | 'split-reverse';
export type HeroSize = 'sm' | 'md' | 'lg';
export type HeroBackground = 'none' | 'subtle' | 'gradient';

/**
 * ml-hero-section - Marketing hero/header section
 *
 * @example
 * ```html
 * <ml-hero-section variant="centered" size="lg">
 *   <span slot="eyebrow">New Release</span>
 *   <span slot="title">Build better apps</span>
 *   <span slot="description">A modern framework for the modern web.</span>
 *   <div slot="actions">
 *     <ml-button variant="primary">Get Started</ml-button>
 *   </div>
 * </ml-hero-section>
 * ```
 *
 * @slot eyebrow - Small text/badge above the title
 * @slot title - Main headline (or use `title` property)
 * @slot description - Supporting text (or use `description` property)
 * @slot actions - CTA buttons
 * @slot media - Image, video, or illustration
 * @slot social-proof - Logos, testimonials, stats below CTA
 */
@MelodicComponent({
	selector: 'ml-hero-section',
	template: heroSectionTemplate,
	styles: heroSectionStyles,
	attributes: ['variant', 'size', 'background', 'title', 'description']
})
export class HeroSectionComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Layout variant */
	variant: HeroVariant = 'centered';

	/** Size controls padding and font sizes */
	size: HeroSize = 'lg';

	/** Background style */
	background: HeroBackground = 'none';

	/** Headline text (alternative to title slot) */
	title = '';

	/** Supporting text (alternative to description slot) */
	description = '';
}
