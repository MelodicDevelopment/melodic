import { html, classMap, when } from '@melodicdev/core';
import type { FileIconComponent } from './file-icon.component.js';

export function fileIconTemplate(c: FileIconComponent) {
	return html`
		<div class=${classMap({
			'ml-file-icon': true,
			[`ml-file-icon--${c.size}`]: true,
			[`ml-file-icon--${c.resolvedColor}`]: true
		})}>
			<svg viewBox="0 0 40 48" fill="none" class="ml-file-icon__svg">
				<!-- Document body -->
				<path d="M0 4C0 1.79 1.79 0 4 0H24L40 16V44C40 46.21 38.21 48 36 48H4C1.79 48 0 46.21 0 44V4Z" class="ml-file-icon__body" />
				<!-- Folded corner -->
				<path d="M24 0L40 16H28C25.79 16 24 14.21 24 12V0Z" class="ml-file-icon__fold" />
			</svg>
			${when(
				!!c.extension,
				() => html`<span class="ml-file-icon__badge">${c.displayExtension}</span>`
			)}
		</div>
	`;
}
