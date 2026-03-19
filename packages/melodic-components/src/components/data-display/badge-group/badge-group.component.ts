import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { BadgeVariant } from '../badge/badge.types.js';
import { badgeGroupTemplate } from './badge-group.template.js';
import { badgeGroupStyles } from './badge-group.styles.js';

type BadgeGroupTheme = 'pill' | 'modern';
type BadgePosition = 'leading' | 'trailing';

/**
 * ml-badge-group - Compound badge pairing a label badge with descriptive text
 *
 * @example
 * ```html
 * <ml-badge-group label="New" variant="primary">We've just released a new feature</ml-badge-group>
 * <ml-badge-group label="Release" variant="success" icon="arrow-right">Check out the latest updates</ml-badge-group>
 * <ml-badge-group label="v2.0" variant="primary" badge-position="trailing">Latest release</ml-badge-group>
 * ```
 *
 * @slot default - Message text content
 */
@MelodicComponent({
	selector: 'ml-badge-group',
	template: badgeGroupTemplate,
	styles: badgeGroupStyles,
	attributes: ['label', 'variant', 'theme', 'size', 'badge-position', 'icon']
})
export class BadgeGroupComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** Inner badge label text */
	public label = '';

	/** Color variant */
	public variant: BadgeVariant = 'default';

	/** Visual theme */
	public theme: BadgeGroupTheme = 'pill';

	/** Size */
	public size: 'sm' | 'md' | 'lg' = 'md';

	/** Position of the inner badge */
	public badgePosition: BadgePosition = 'leading';

	/** Optional trailing icon name */
	public icon = '';
}
