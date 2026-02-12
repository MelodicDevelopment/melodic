import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { breadcrumbTemplate } from './breadcrumb.template.js';
import { breadcrumbStyles } from './breadcrumb.styles.js';

type BreadcrumbSeparator = 'slash' | 'chevron';

/**
 * ml-breadcrumb - Breadcrumb navigation container
 *
 * @example
 * ```html
 * <ml-breadcrumb>
 *   <ml-breadcrumb-item href="/">Home</ml-breadcrumb-item>
 *   <ml-breadcrumb-item href="/settings">Settings</ml-breadcrumb-item>
 *   <ml-breadcrumb-item current>Profile</ml-breadcrumb-item>
 * </ml-breadcrumb>
 * ```
 *
 * @slot default - Breadcrumb items
 */
@MelodicComponent({
	selector: 'ml-breadcrumb',
	template: breadcrumbTemplate,
	styles: breadcrumbStyles,
	attributes: ['separator']
})
export class BreadcrumbComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Separator style between items */
	separator: BreadcrumbSeparator = 'chevron';
}
