import { html, classMap, when } from '@melodicdev/core';
import type { ActivityFeedItemComponent } from './activity-feed-item.component.js';

export function activityFeedItemTemplate(c: ActivityFeedItemComponent) {
	return html`
		<article class="ml-afi">
			<div class="ml-afi__left">
				<div class="ml-afi__avatar">
					${when(
						c.hasAvatarSlot,
						() => html`<slot name="avatar"></slot>`,
						() => html`
							<ml-avatar
								size=${c['avatar-size']}
								src=${c['avatar-src']}
								initials=${c['avatar-initials']}
							></ml-avatar>
						`
					)}
				</div>
				<div class="ml-afi__connector"></div>
			</div>
			<div class="ml-afi__body">
				<div class="ml-afi__header">
					<div class="ml-afi__meta">
						${when(!!c.name, () => html`<span class="ml-afi__name">${c.name}</span>`)}
						${when(!!c.timestamp, () => html`<span class="ml-afi__timestamp">${c.timestamp}</span>`)}
					</div>
					${when(
						c.indicator,
						() => html`
							<span
								class=${classMap({
									'ml-afi__indicator': true,
									[`ml-afi__indicator--${c['indicator-color']}`]: true
								})}
							></span>
						`
					)}
				</div>
				${when(!!c.subtitle, () => html`<div class="ml-afi__subtitle">${c.subtitle}</div>`)}
				<div class="ml-afi__description">
					<slot></slot>
				</div>
				${when(
					c.hasContentSlot,
					() => html`
						<div class="ml-afi__content">
							<slot name="content"></slot>
						</div>
					`
				)}
			</div>
		</article>
	`;
}
