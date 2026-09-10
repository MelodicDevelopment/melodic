import type { TemplateResult } from '../classes/template-result.class';
import type { RenderedContainer } from '../interfaces/irendered-container.interface';
import { clearBetween } from './marker-range.functions';

/**
 * Re-render a template into a detached item container whose child nodes were
 * moved into the live DOM between `start` and `end` (the repeat-item /
 * array-item pattern: parts stay on the fragment, nodes live between markers).
 *
 * Same template structure → in-place commit; the live nodes update through
 * the stored parts and nothing moves.
 *
 * Different structure → renderInto() disposes the old part tree and rebuilds
 * the new structure inside the DETACHED fragment, so the rebuilt nodes must be
 * swapped into the live DOM here: everything currently between the markers is
 * removed (the live range, not a snapshot — nested parts may have swapped
 * nodes since the item was created) and the fragment is inserted before `end`.
 *
 * @returns true when the item's live nodes were replaced (its DOM identity did
 * not survive), false when the existing nodes were updated in place.
 */
export function renderDetachedItem(template: TemplateResult, container: DocumentFragment, start: Node, end: Node): boolean {
	const target = container as RenderedContainer<DocumentFragment>;
	const structureChanged = target.__parts !== undefined && target.__templateKey !== template.templateKey;

	template.renderInto(container);

	if (!structureChanged) {
		return false;
	}

	clearBetween(start, end);
	end.parentNode?.insertBefore(container, end);
	return true;
}
