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
	elementRef!: HTMLElement;

	/** Page title text */
	title = '';

	/** Page description text */
	description = '';

	/** Visual variant */
	variant: PageHeaderVariant = 'default';

	/** Show bottom border */
	divider = true;

	/** Check if breadcrumb slot has content */
	get hasBreadcrumb(): boolean {
		return this.elementRef?.querySelector('[slot="breadcrumb"]') !== null;
	}

	/** Check if title slot has content */
	get hasTitleSlot(): boolean {
		return this.elementRef?.querySelector('[slot="title"]') !== null;
	}

	/** Check if description slot has content */
	get hasDescriptionSlot(): boolean {
		return this.elementRef?.querySelector('[slot="description"]') !== null;
	}

	/** Check if actions slot has content */
	get hasActions(): boolean {
		return this.elementRef?.querySelector('[slot="actions"]') !== null;
	}

	/** Check if tabs slot has content */
	get hasTabs(): boolean {
		return this.elementRef?.querySelector('[slot="tabs"]') !== null;
	}

	/** Check if meta slot has content */
	get hasMeta(): boolean {
		return this.elementRef?.querySelector('[slot="meta"]') !== null;
	}
}
