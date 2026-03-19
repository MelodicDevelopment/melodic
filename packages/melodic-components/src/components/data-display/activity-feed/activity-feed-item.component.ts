import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { activityFeedItemTemplate } from './activity-feed-item.template.js';
import { activityFeedItemStyles } from './activity-feed-item.styles.js';

type IndicatorColor = 'success' | 'warning' | 'error' | 'primary' | 'gray';

/**
 * ml-activity-feed-item - Individual activity entry within a feed
 *
 * @example
 * ```html
 * <ml-activity-feed-item name="Jane Doe" timestamp="2 hours ago" avatar-initials="JD">
 *   Updated the project status
 * </ml-activity-feed-item>
 * ```
 *
 * @slot default - Activity description
 * @slot avatar - Custom avatar or icon (replaces default ml-avatar)
 * @slot content - Extra content below the description
 */
@MelodicComponent({
	selector: 'ml-activity-feed-item',
	template: activityFeedItemTemplate,
	styles: activityFeedItemStyles,
	attributes: ['name', 'timestamp', 'avatar-src', 'avatar-initials', 'avatar-size', 'subtitle', 'indicator', 'indicator-color']
})
export class ActivityFeedItemComponent implements IElementRef {
	public elementRef!: HTMLElement;

	/** User display name */
	public name = '';

	/** Timestamp text */
	public timestamp = '';

	/** Avatar image source */
	public 'avatar-src' = '';

	/** Avatar initials fallback */
	public 'avatar-initials' = '';

	/** Avatar size */
	public 'avatar-size': Size = 'sm';

	/** Subtitle text (e.g. @handle) */
	public subtitle = '';

	/** Show indicator dot */
	public indicator = false;

	/** Indicator dot color */
	public 'indicator-color': IndicatorColor = 'gray';

	/** Check if avatar slot has content */
	public get hasAvatarSlot(): boolean {
		return this.elementRef?.querySelector('[slot="avatar"]') !== null;
	}

	/** Check if content slot has content */
	public get hasContentSlot(): boolean {
		return this.elementRef?.querySelector('[slot="content"]') !== null;
	}
}
