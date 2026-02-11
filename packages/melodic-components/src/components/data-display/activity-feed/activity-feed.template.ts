import { html, classMap } from '@melodicdev/core';
import type { ActivityFeedComponent } from './activity-feed.component.js';

export function activityFeedTemplate(c: ActivityFeedComponent) {
	return html`
		<div
			class=${classMap({
				'ml-activity-feed': true,
				[`ml-activity-feed--${c.variant}`]: true
			})}
			role="feed"
		>
			<slot></slot>
		</div>
	`;
}
