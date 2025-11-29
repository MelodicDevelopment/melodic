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
interface UnsafeHTMLState {
	html: string;
	startMarker: Comment;
	endMarker: Comment;
	nodes: Node[];
}

export function unsafeHTML(html: string): DirectiveResult {
	return directive((container: Node, previousState?: UnsafeHTMLState) => {
		// First render - setup markers
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) {
				throw new Error('unsafeHTML() directive: container must be attached to a parent node');
			}

			const startMarker = document.createComment('unsafeHTML-start');
			const endMarker = document.createComment('unsafeHTML-end');

			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);

			const state: UnsafeHTMLState = {
				html: '',
				startMarker,
				endMarker,
				nodes: []
			};

			renderHTML(html, state);
			return state;
		}

		// Skip if HTML hasn't changed
		if (previousState.html === html) {
			return previousState;
		}

		// Update HTML
		renderHTML(html, previousState);
		return previousState;
	});
}

function renderHTML(html: string, state: UnsafeHTMLState): void {
	const parent = state.startMarker.parentNode;
	if (!parent) {
		throw new Error('unsafeHTML() directive: markers not in DOM');
	}

	// Remove old nodes
	for (const node of state.nodes) {
		node.parentNode?.removeChild(node);
	}

	// Create new nodes from HTML
	const temp = document.createElement('div');
	temp.innerHTML = html;

	const fragment = document.createDocumentFragment();
	while (temp.firstChild) {
		fragment.appendChild(temp.firstChild);
	}

	// Insert new nodes between markers
	state.nodes = Array.from(fragment.childNodes);
	for (const node of state.nodes) {
		parent.insertBefore(node, state.endMarker);
	}

	state.html = html;
}
