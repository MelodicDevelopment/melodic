import { MelodicComponent } from '@melodicdev/core';
import { iconTemplate } from './icon.template.js';
import { iconStyles } from './icon.styles.js';

/**
 * ml-icon - Icon component for displaying vector icons
 *
 * This component uses the Phosphor Icons library to render icons via ligatures by default.
 * https://phosphoricons.com/
 *
 * @example
 * ```typescript
 *
 * html`<ml-icon .icon=${'arrow-left'} size="md"></ml-icon>`
 * ```
 */
@MelodicComponent({
	selector: 'ml-icon',
	template: iconTemplate,
	styles: iconStyles,
	attributes: ['icon', 'format', 'size']
})
export class IconComponent {
	/** phosphor icon ligature */
	icon: string = '';

	/** phosphor icon format */
	format: 'bold' | 'fill' | 'light' | 'regular' | 'thin' = 'regular';
}
