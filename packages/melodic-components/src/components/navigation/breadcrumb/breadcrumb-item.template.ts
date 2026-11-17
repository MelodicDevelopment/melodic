import { html, classMap, when } from '@melodicdev/core';
import type { BreadcrumbItemComponent } from './breadcrumb-item.component.js';
import { routeAnchorClick } from '../functions/route-link.function.js';

export function breadcrumbItemTemplate(c: BreadcrumbItemComponent) {

	return html`
		<li
			class=${classMap({
				'ml-breadcrumb-item': true,
				'ml-breadcrumb-item--current': c.current
			})}
		>
			<span class="ml-breadcrumb-item__separator" aria-hidden="true">
				${c.separator === 'slash'
					? // The icon font has no forward-slash glyph ("slash-forward" rendered nothing).
						'/'
					: html`<ml-icon icon="caret-right" size="sm"></ml-icon>`}
			</span>
			${when(
				!!c.href && !c.current,
				() => html`
					<a class="ml-breadcrumb-item__link" href=${c.href} @click=${(event: MouseEvent) => routeAnchorClick(event, c.href)}>
						${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
						<slot></slot>
					</a>
				`,
				() => html`
					<span class="ml-breadcrumb-item__text" aria-current=${c.current ? 'page' : false}>
						${when(!!c.icon, () => html`<ml-icon icon=${c.icon} size="sm"></ml-icon>`)}
						<slot></slot>
					</span>
				`
			)}
		</li>
	`;
}
