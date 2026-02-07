import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import { breadcrumbItemTemplate } from './breadcrumb-item.template.js';
import { breadcrumbItemStyles } from './breadcrumb-item.styles.js';

/**
 * ml-breadcrumb-item - Individual breadcrumb link or label
 *
 * @example
 * ```html
 * <ml-breadcrumb-item href="/settings" icon="gear">Settings</ml-breadcrumb-item>
 * <ml-breadcrumb-item current>Profile</ml-breadcrumb-item>
 * ```
 *
 * @slot default - Item label text
 */
@MelodicComponent({
	selector: 'ml-breadcrumb-item',
	template: breadcrumbItemTemplate,
	styles: breadcrumbItemStyles,
	attributes: ['href', 'icon', 'current', 'separator']
})
export class BreadcrumbItemComponent implements IElementRef, OnCreate {
	elementRef!: HTMLElement;

	/** Link URL (omit for current/non-clickable page) */
	href = '';

	/** Optional left icon */
	icon = '';

	/** Marks as the current/active page */
	current = false;

	/** Separator type inherited from parent (set via CSS/attribute) */
	separator: 'slash' | 'chevron' = 'chevron';

	onCreate(): void {
		const parent = this.elementRef.closest('ml-breadcrumb');
		if (parent) {
			const sep = parent.getAttribute('separator');
			if (sep === 'slash' || sep === 'chevron') {
				this.separator = sep;
			}
		}
	}
}
