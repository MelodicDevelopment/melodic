/**
 * UnsafeHTML directive - Render raw HTML
 *
 * ⚠️ WARNING: Only use with trusted content! This can expose you to XSS attacks.
 */

import { directive, type DirectiveResult } from '../directive';

/**
 * Renders raw HTML string into the DOM.
 *
 * ⚠️ SECURITY WARNING: Only use with trusted, sanitized HTML!
 * Never use with user-generated content without sanitization.
 *
 * Usage:
 *   <div>${unsafeHTML('<strong>Bold text</strong>')}</div>
 *
 * @param html - Raw HTML string to render
 */
export function unsafeHTML(html: string): DirectiveResult {
	return directive((container: Node, previousHTML?: string) => {
		// Skip if HTML hasn't changed
		if (previousHTML === html) {
			return html;
		}

		const parent = container.parentElement || container.parentNode;
		if (!parent) return html;

		// Create a temporary container
		const temp = document.createElement('div');
		temp.innerHTML = html;

		// Replace the container with the parsed nodes
		const fragment = document.createDocumentFragment();
		while (temp.firstChild) {
			fragment.appendChild(temp.firstChild);
		}

		parent.replaceChild(fragment, container);

		return html;
	});
}
