import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import { pageSectionTemplate } from './page-section.template.js';
import { pageSectionStyles } from './page-section.styles.js';

type SectionPadding = 'none' | 'sm' | 'md' | 'lg';

let warnedDeprecatedTitle = false;
function warnDeprecatedTitle(): void {
	if (warnedDeprecatedTitle) return;
	warnedDeprecatedTitle = true;
	console.warn(
		'[ml-page-section] The "title" attribute/property is deprecated because it collides with the global HTML title attribute (native tooltip). Use "section-title" instead. The "title" shim will be removed in the next major release.'
	);
}

/**
 * ml-page-section - Titled content section with consistent heading typography
 *
 * @example
 * ```html
 * <ml-page-section section-title="Recent Activity" subtitle="Last 7 days">
 *   <div>Section content here</div>
 * </ml-page-section>
 *
 * <ml-page-section section-title="Members" action-label="View All" action-href="/members">
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
	attributes: ['section-title', 'title', 'subtitle', 'action-label', 'action-href', 'padding']
})
export class PageSectionComponent implements IElementRef, OnCreate {
	public elementRef!: HTMLElement;

	/** Section title (attribute: section-title) */
	public sectionTitle = '';

	/** Subtitle text */
	public subtitle = '';

	/** @deprecated Use `sectionTitle` (attribute `section-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.sectionTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitle();
		this.sectionTitle = value;
	}

	/** Action link label (attribute: action-label) */
	public actionLabel = '';

	/** Action link URL (attribute: action-href). Only http(s), relative, and fragment URLs are rendered. */
	public actionHref = '';

	/** Content padding */
	public padding: SectionPadding = 'md';

	/** @deprecated Legacy property alias — use `actionLabel` (attribute `action-label`). */
	public get 'action-label'(): string {
		return this.actionLabel;
	}
	public set 'action-label'(value: string) {
		this.actionLabel = value;
	}

	/** @deprecated Legacy property alias — use `actionHref` (attribute `action-href`). */
	public get 'action-href'(): string {
		return this.actionHref;
	}
	public set 'action-href'(value: string) {
		this.actionHref = value;
	}

	/** Whether the action slot has content (toggled via slotchange) */
	public hasAction = false;

	public onCreate(): void {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;

		const slot = shadow.querySelector('slot[name="action"]') as HTMLSlotElement | null;
		slot?.addEventListener('slotchange', () => {
			this.hasAction = slot.assignedNodes().length > 0;
		});
	}
}
