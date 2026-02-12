import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { activityFeedTemplate } from './activity-feed.template.js';
import { activityFeedStyles } from './activity-feed.styles.js';

type ActivityFeedVariant = 'list' | 'timeline';

/**
 * ml-activity-feed - Container for displaying chronological user activities
 *
 * @example
 * ```html
 * <ml-activity-feed variant="list">
 *   <ml-activity-feed-item name="Jane Doe" timestamp="2 hours ago">
 *     Updated the project status
 *   </ml-activity-feed-item>
 * </ml-activity-feed>
 * ```
 *
 * @slot default - Activity feed items
 */
@MelodicComponent({
	selector: 'ml-activity-feed',
	template: activityFeedTemplate,
	styles: activityFeedStyles,
	attributes: ['variant']
})
export class ActivityFeedComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Feed display variant */
	variant: ActivityFeedVariant = 'list';
}
