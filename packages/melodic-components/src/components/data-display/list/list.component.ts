import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { listTemplate } from './list.template.js';
import { listStyles } from './list.styles.js';

type ListVariant = 'default' | 'plain';
type ListSize = 'sm' | 'md' | 'lg';

/**
 * ml-list - Container for displaying a list of items
 *
 * @example
 * ```html
 * <ml-list variant="default" size="md">
 *   <ml-list-item primary="Jane Doe" secondary="Developer">
 *     <ml-avatar slot="leading" initials="JD"></ml-avatar>
 *   </ml-list-item>
 * </ml-list>
 * ```
 *
 * @slot default - List items
 */
@MelodicComponent({
	selector: 'ml-list',
	template: listTemplate,
	styles: listStyles,
	attributes: ['variant', 'size']
})
export class ListComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** List display variant */
	variant: ListVariant = 'default';

	/** List size (controls item padding) */
	size: ListSize = 'md';
}
