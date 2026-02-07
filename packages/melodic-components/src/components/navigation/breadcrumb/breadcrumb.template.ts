import { html } from '@melodicdev/core';
import type { BreadcrumbComponent } from './breadcrumb.component.js';

export function breadcrumbTemplate(_c: BreadcrumbComponent) {
	return html`
		<nav class="ml-breadcrumb" aria-label="Breadcrumb">
			<ol class="ml-breadcrumb__list">
				<slot></slot>
			</ol>
		</nav>
	`;
}
