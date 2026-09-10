/**
 * DOM range helpers for content that lives between a pair of marker nodes.
 *
 * Rendered content is bounded by markers (a node part's `startMarker` /
 * `endMarker`, a directive's markers, an array item's markers). The nodes
 * between them are NOT a fixed set: a nested node part inside that content
 * swaps its own nodes whenever its template structure changes, so any list of
 * "the nodes I inserted" captured at render time goes stale. Teardown and
 * moves therefore walk the live range between the markers instead of trusting
 * a snapshot — nothing a child part inserted can outlive its parent.
 */

/**
 * Removes every node strictly between `start` and `end`, leaving the markers
 * (and `keep`, when given) in place. No-op when the markers are detached.
 */
export function clearBetween(start: Node, end: Node, keep?: Node): void {
	const parent = start.parentNode;
	if (!parent) return;

	let node: Node | null = start.nextSibling;
	while (node && node !== end) {
		const next: Node | null = node.nextSibling;
		if (node !== keep) {
			parent.removeChild(node);
		}
		node = next;
	}
}

/**
 * Removes the inclusive range `[start, end]` — the markers and everything
 * between them.
 */
export function removeRange(start: Node, end: Node): void {
	let node: Node | null = start;
	while (node) {
		const next: Node | null = node.nextSibling;
		node.parentNode?.removeChild(node);
		if (node === end) break;
		node = next;
	}
}

/**
 * Moves the inclusive range `[start, end]` so it sits immediately before
 * `referenceNode`. `referenceNode` must not lie inside the range.
 */
export function moveRange(start: Node, end: Node, referenceNode: Node): void {
	const parent = referenceNode.parentNode;
	if (!parent) return;

	const fragment = document.createDocumentFragment();
	let node: Node | null = start;
	while (node) {
		const next: Node | null = node.nextSibling;
		fragment.appendChild(node);
		if (node === end) break;
		node = next;
	}

	parent.insertBefore(fragment, referenceNode);
}
