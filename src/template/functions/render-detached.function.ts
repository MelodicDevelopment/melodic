import type { TemplateResult } from '../classes/template-result.class';
import type { RenderedContainer } from '../interfaces/irendered-container.interface';

/**
 * Re-render a template into a detached item container whose child nodes were
 * moved into the live DOM (the repeat-item / keyed-array pattern: parts stay
 * on the fragment, nodes live between markers).
 *
 * Same template structure → in-place commit; the live nodes update through
 * the stored parts and are returned unchanged.
 *
 * Different structure → renderInto() disposes the old part tree and rebuilds
 * the new structure inside the DETACHED fragment, so the rebuilt nodes must be
 * swapped into the live DOM here: they are inserted before the first live
 * node (falling back to `fallbackAnchor`, e.g. the item's end marker) and the
 * stale live nodes are removed.
 *
 * @returns the item's current live node list.
 */
export function renderDetachedItem(template: TemplateResult, container: DocumentFragment, liveNodes: Node[], fallbackAnchor?: Node): Node[] {
	const target = container as RenderedContainer<DocumentFragment>;
	const structureChanged = target.__parts !== undefined && target.__templateKey !== template.templateKey;

	template.renderInto(container);

	if (!structureChanged) {
		return liveNodes;
	}

	const newNodes = Array.from(container.childNodes);

	let anchor: Node | null = null;
	for (const node of liveNodes) {
		if (node.parentNode) {
			anchor = node;
			break;
		}
	}
	if (!anchor && fallbackAnchor?.parentNode) {
		anchor = fallbackAnchor;
	}

	if (anchor?.parentNode) {
		const parent = anchor.parentNode;
		for (const node of newNodes) {
			parent.insertBefore(node, anchor);
		}
	}

	for (const node of liveNodes) {
		node.parentNode?.removeChild(node);
	}

	return newNodes;
}
