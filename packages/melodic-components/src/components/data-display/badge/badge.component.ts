import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import type { BadgeVariant } from './badge.types.js';
import { badgeTemplate } from './badge.template.js';
import { badgeStyles } from './badge.styles.js';

/**
 * ml-badge - Badge/tag component for status indicators
 *
 * @example
 * ```html
 * <ml-badge>Default</ml-badge>
 * <ml-badge variant="success">Active</ml-badge>
 * <ml-badge variant="error" dot>Offline</ml-badge>
 * ```
 *
 * @slot default - Badge label content
 */
@MelodicComponent({
	selector: 'ml-badge',
	template: badgeTemplate,
	styles: badgeStyles,
	attributes: ['variant', 'size', 'dot', 'pill', 'color']
})
export class BadgeComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Badge variant */
	public variant: BadgeVariant = 'default';

	/** Badge size */
	public size: Size = 'md';

	/** Show dot indicator */
	public dot = false;

	/** Use pill (rounded) shape */
	public pill = false;

	/** Custom background color — any CSS color value. Overrides variant colors. */
	public color = '';
}
