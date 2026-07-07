import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import { watchSlotPresence, warnDeprecatedTitleOnce } from '../../../functions/index.js';
import { pageHeaderTemplate } from './page-header.template.js';
import { pageHeaderStyles } from './page-header.styles.js';

export type PageHeaderVariant = 'default' | 'compact' | 'centered';

/**
 * ml-page-header - Section component for page titles with breadcrumb, description, and actions
 *
 * @example
 * ```html
 * <ml-page-header header-title="Dashboard" description="Overview of your account">
 *   <ml-breadcrumb slot="breadcrumb">
 *     <ml-breadcrumb-item href="/">Home</ml-breadcrumb-item>
 *     <ml-breadcrumb-item>Dashboard</ml-breadcrumb-item>
 *   </ml-breadcrumb>
 *   <ml-button slot="actions" variant="primary">Create New</ml-button>
 * </ml-page-header>
 * ```
 *
 * @slot breadcrumb - For ml-breadcrumb component
 * @slot title - Page title (alternative to title property)
 * @slot description - Supporting text below title
 * @slot actions - Action buttons (right-aligned)
 * @slot tabs - Optional tab navigation below the header
 * @slot meta - Optional metadata area (badges, status, etc.)
 */
@MelodicComponent({
	selector: 'ml-page-header',
	template: pageHeaderTemplate,
	styles: pageHeaderStyles,
	attributes: ['variant', 'divider', 'header-title', 'title', 'description']
})
export class PageHeaderComponent implements IElementRef, OnCreate {
	public elementRef!: HTMLElement;

	/** Page title text (attribute: header-title) */
	public headerTitle = '';

	/** Page description text */
	public description = '';

	/** @deprecated Use `headerTitle` (attribute `header-title`); `title` collides with the global HTML attribute. */
	public get title(): string {
		return this.headerTitle;
	}
	public set title(value: string) {
		warnDeprecatedTitleOnce('ml-page-header', 'header-title');
		this.headerTitle = value;
	}

	/** Visual variant */
	public variant: PageHeaderVariant = 'default';

	/** Show bottom border */
	public divider = true;

	/** Slot visibility flags (toggled via slotchange so late-inserted content projects) */
	public hasBreadcrumb = false;
	public hasTitleSlot = false;
	public hasDescriptionSlot = false;
	public hasActions = false;
	public hasTabs = false;
	public hasMeta = false;

	public onCreate(): void {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;

		watchSlotPresence(shadow, (name, hasContent) => {
			if (name === 'breadcrumb') this.hasBreadcrumb = hasContent;
			else if (name === 'title') this.hasTitleSlot = hasContent;
			else if (name === 'description') this.hasDescriptionSlot = hasContent;
			else if (name === 'actions') this.hasActions = hasContent;
			else if (name === 'tabs') this.hasTabs = hasContent;
			else if (name === 'meta') this.hasMeta = hasContent;
		});
	}
}
