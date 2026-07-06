import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate } from '@melodicdev/core';
import type { Size } from '../../../types/index.js';
import { watchSlotPresence, defineLegacyAliases } from '../../../functions/index.js';
import { activityFeedItemTemplate } from './activity-feed-item.template.js';
import { activityFeedItemStyles } from './activity-feed-item.styles.js';

type IndicatorPreset = 'success' | 'warning' | 'error' | 'primary' | 'gray';
const INDICATOR_PRESETS = new Set<string>(['success', 'warning', 'error', 'primary', 'gray']);

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
export class ActivityFeedItemComponent implements IElementRef, OnCreate {
	public elementRef!: HTMLElement;

	/** User display name */
	public name = '';

	/** Timestamp text */
	public timestamp = '';

	/** Avatar image source (attribute: avatar-src) */
	public avatarSrc = '';

	/** Avatar initials fallback (attribute: avatar-initials) */
	public avatarInitials = '';

	/** Avatar size (attribute: avatar-size) */
	public avatarSize: Size = 'sm';

	/** Subtitle text (e.g. @handle) */
	public subtitle = '';

	/** Show indicator dot */
	public indicator = false;

	/** Indicator dot color — preset name or any CSS color value (attribute: indicator-color) */
	public indicatorColor: IndicatorPreset | string = 'gray';

	/** Whether the indicator-color is a preset name */
	public get isPresetColor(): boolean {
		return INDICATOR_PRESETS.has(this.indicatorColor);
	}

	/** Whether the avatar slot has content (kept in sync via slotchange) */
	public hasAvatarSlot = false;

	/** Whether the content slot has content (kept in sync via slotchange) */
	public hasContentSlot = false;

	public onCreate(): void {
		// Slot presence is reactive (profile-card pattern): content added or
		// removed after mount projects correctly instead of being frozen at the
		// value a render-time querySelector saw. (The avatar slot additionally
		// uses native slot fallback for the default ml-avatar.)
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		watchSlotPresence(shadow, (name, hasContent) => {
			if (name === 'avatar') this.hasAvatarSlot = hasContent;
			else if (name === 'content') this.hasContentSlot = hasContent;
		});
	}
}

// Deprecated quoted kebab-case property aliases (warn once on first write;
// removed in the next major release).
defineLegacyAliases(ActivityFeedItemComponent.prototype, 'ml-activity-feed-item', {
	'avatar-src': 'avatarSrc',
	'avatar-initials': 'avatarInitials',
	'avatar-size': 'avatarSize',
	'indicator-color': 'indicatorColor'
});
