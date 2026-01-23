import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { iconTemplate } from './icon.template.js';
import { iconStyles } from './icon.styles.js';

/**
 * ml-icon - Icon component for displaying vector icons
 *
 * @example
 * ```html
 * <ml-icon name="home" size="lg" color="blue"></ml-icon>
 * ```
 *
 * @slot default - Custom icon content
 */
@MelodicComponent({
	selector: 'ml-icon',
	template: iconTemplate,
	styles: iconStyles,
	attributes: ['name', 'size', 'color']
})
export class IconComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Name of the icon to display */
	name = '';

	/** Size of the icon */
	size: 'sm' | 'md' | 'lg' = 'md';

	/** Color of the icon */
	color = '';
}
