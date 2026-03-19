import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { pageHeaderTemplate } from './page-header.template.js';
import { pageHeaderStyles } from './page-header.styles.js';

export type PageHeaderVariant = 'default' | 'compact' | 'centered';

/**
 * ml-page-header - Section component for page titles with breadcrumb, description, and actions
 *
 * @example
 * ```html
 * <ml-page-header title="Dashboard" description="Overview of your account">
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
	attributes: ['variant', 'divider', 'title', 'description']
})
export class PageHeaderComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Page title text */
	public title = '';

	/** Page description text */
	public description = '';

	/** Visual variant */
	public variant: PageHeaderVariant = 'default';

	/** Show bottom border */
	public divider = true;

	/** Check if breadcrumb slot has content */
	public get hasBreadcrumb(): boolean {
		return this.elementRef?.querySelector('[slot="breadcrumb"]') !== null;
	}

	/** Check if title slot has content */
	public get hasTitleSlot(): boolean {
		return this.elementRef?.querySelector('[slot="title"]') !== null;
	}

	/** Check if description slot has content */
	public get hasDescriptionSlot(): boolean {
		return this.elementRef?.querySelector('[slot="description"]') !== null;
	}

	/** Check if actions slot has content */
	public get hasActions(): boolean {
		return this.elementRef?.querySelector('[slot="actions"]') !== null;
	}

	/** Check if tabs slot has content */
	public get hasTabs(): boolean {
		return this.elementRef?.querySelector('[slot="tabs"]') !== null;
	}

	/** Check if meta slot has content */
	public get hasMeta(): boolean {
		return this.elementRef?.querySelector('[slot="meta"]') !== null;
	}
}
