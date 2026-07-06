import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { heroSectionTemplate } from './hero-section.template.js';
import { heroSectionStyles } from './hero-section.styles.js';

export type HeroVariant = 'centered' | 'split' | 'split-reverse';
export type HeroSize = 'sm' | 'md' | 'lg';
export type HeroBackground = 'none' | 'subtle' | 'gradient';

let warnedDeprecatedTitle = false;
function warnDeprecatedTitle(): void {
	if (warnedDeprecatedTitle) return;
	warnedDeprecatedTitle = true;
	console.warn(
		'[ml-hero-section] The "title" attribute/property is deprecated because it collides with the global HTML title attribute (native tooltip). Use "hero-title" instead. The "title" shim will be removed in the next major release.'
	);
}

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
 * @slot title - Main headline (or use `hero-title` attribute)
 * @slot description - Supporting text (or use `description` property)
 * @slot actions - CTA buttons
 * @slot media - Image, video, or illustration
 * @slot social-proof - Logos, testimonials, stats below CTA
 */
@MelodicComponent({
	selector: 'ml-hero-section',
	template: heroSectionTemplate,
	styles: heroSectionStyles,
	attributes: ['variant', 'size', 'background', 'hero-title', 'title', 'description']
})
export class HeroSectionComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Layout variant */
	public variant: HeroVariant = 'centered';

	/** Size controls padding and font sizes */
	public size: HeroSize = 'lg';

	/** Background style */
	public background: HeroBackground = 'none';

	/** Headline text (attribute: hero-title; alternative to title slot) */
	public heroTitle = '';

	/** Supporting text (alternative to description slot) */
	public description = '';

	/** @deprecated Use `heroTitle` (attribute `hero-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.heroTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitle();
		this.heroTitle = value;
	}
}
