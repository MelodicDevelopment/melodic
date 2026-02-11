import { html, when } from '@melodicdev/core';
import type { ListItemComponent } from './list-item.component.js';

export function listItemTemplate(c: ListItemComponent) {
	return html`
		<div class="ml-li" role="listitem">
			${when(
				c.hasLeadingSlot,
				() => html`
					<div class="ml-li__leading">
						<slot name="leading"></slot>
					</div>
				`
			)}
			<div class="ml-li__content">
				${when(!!c.primary, () => html`<span class="ml-li__primary">${c.primary}</span>`)}
				${when(!!c.secondary, () => html`<span class="ml-li__secondary">${c.secondary}</span>`)}
				<slot></slot>
			</div>
			${when(
				c.hasTrailingSlot,
				() => html`
					<div class="ml-li__trailing">
						<slot name="trailing"></slot>
					</div>
				`
			)}
		</div>
	`;
}
