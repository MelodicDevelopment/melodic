import { html, classMap, when } from '@melodicdev/core';
import type { BreadcrumbItemComponent } from './breadcrumb-item.component.js';

export function breadcrumbItemTemplate(c: BreadcrumbItemComponent) {
	const separatorIcon = c.separator === 'slash' ? 'slash-forward' : 'caret-right';

	return html`
		<li
			class=${classMap({
				'ml-breadcrumb-item': true,
				'ml-breadcrumb-item--current': c.current
			})}
		>
			<span class="ml-breadcrumb-item__separator">
				<ml-icon icon=${separatorIcon} size="sm"></ml-icon>
			</span>
			${when(
				!!c.href && !c.current,
				() => html`
					<a class="ml-breadcrumb-item__link" href=${c.href}>
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
