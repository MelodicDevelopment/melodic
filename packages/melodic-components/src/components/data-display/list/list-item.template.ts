import { html, classMap, when } from '@melodicdev/core';
import type { ListItemComponent } from './list-item.component.js';

// The role (listitem, or button when interactive) lives on the HOST element,
// managed by the component. The named slots are ALWAYS rendered — hiding them
// with a class instead of `when` keeps slotchange firing, so content inserted
// after mount still projects.
export function listItemTemplate(c: ListItemComponent) {
	return html`
		<div class="ml-li">
			<div class=${classMap({
				'ml-li__leading': true,
				'ml-li__leading--hidden': !c.hasLeadingSlot
			})}>
				<slot name="leading"></slot>
			</div>
			<div class="ml-li__content">
				${when(!!c.primary, () => html`<span class="ml-li__primary">${c.primary}</span>`)}
				${when(!!c.secondary, () => html`<span class="ml-li__secondary">${c.secondary}</span>`)}
				<slot></slot>
			</div>
			<div class=${classMap({
				'ml-li__trailing': true,
				'ml-li__trailing--hidden': !c.hasTrailingSlot
			})}>
				<slot name="trailing"></slot>
			</div>
		</div>
	`;
}
