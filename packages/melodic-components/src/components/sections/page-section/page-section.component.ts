import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { pageSectionTemplate } from './page-section.template.js';
import { pageSectionStyles } from './page-section.styles.js';

type SectionPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * ml-page-section - Titled content section with consistent heading typography
 *
 * @example
 * ```html
 * <ml-page-section title="Recent Activity" subtitle="Last 7 days">
 *   <div>Section content here</div>
 * </ml-page-section>
 *
 * <ml-page-section title="Members" action-label="View All" action-href="/members">
 *   <div>Members list</div>
 * </ml-page-section>
 * ```
 *
 * @slot default - Section content
 * @slot action - Override for complex action content (replaces action-label link)
 *
 * @cssproperty --ml-page-section-title-font - Title font family (default: 'Cormorant Garamond', serif)
 * @cssproperty --ml-page-section-gap - Gap between header and content (default: var(--ml-space-4))
 */
@MelodicComponent({
	selector: 'ml-page-section',
	template: pageSectionTemplate,
	styles: pageSectionStyles,
	attributes: ['title', 'subtitle', 'action-label', 'action-href', 'padding']
})
export class PageSectionComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Section title */
	public title = '';

	/** Subtitle text */
	public subtitle = '';

	/** Action link label */
	public 'action-label' = '';

	/** Action link URL */
	public 'action-href' = '';

	/** Content padding */
	public padding: SectionPadding = 'md';

	/** Check if action slot has content */
	public get hasActionSlot(): boolean {
		return this.elementRef?.querySelector('[slot="action"]') !== null;
	}
}
