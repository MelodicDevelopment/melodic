import { html, classMap, when } from '@melodicdev/core';
import type { ActivityFeedItemComponent } from './activity-feed-item.component.js';

export function activityFeedItemTemplate(c: ActivityFeedItemComponent) {
	return html`
		<article class="ml-afi">
			<div class="ml-afi__left">
				<div class="ml-afi__avatar">
					<slot name="avatar">
						<ml-avatar
							size=${c.avatarSize}
							src=${c.avatarSrc}
							initials=${c.avatarInitials}
						></ml-avatar>
					</slot>
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
									[`ml-afi__indicator--${c.indicatorColor}`]: c.isPresetColor
								})}
								style=${c.isPresetColor ? '' : `--ml-afi-indicator-bg: ${c.indicatorColor}`}
							></span>
						`
					)}
				</div>
				${when(!!c.subtitle, () => html`<div class="ml-afi__subtitle">${c.subtitle}</div>`)}
				<div class="ml-afi__description">
					<slot></slot>
				</div>
				<div class=${classMap({
					'ml-afi__content': true,
					'ml-afi__content--hidden': !c.hasContentSlot
				})}>
					<slot name="content"></slot>
				</div>
			</div>
		</article>
	`;
}
