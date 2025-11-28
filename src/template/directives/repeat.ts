/**
 * Repeat directive - Efficient keyed list rendering
 */

import type { DirectiveResult } from '../directive';
import type { TemplateResult } from '../template';

interface RepeatState {
	keyToIndex: Map<unknown, number>;
	items: RepeatItem[];
	startMarker: Comment;
	endMarker: Comment;
}

interface RepeatItem {
	key: unknown;
	value: any;
	container: DocumentFragment;
	nodes: Node[];
}

/**
 * Efficiently renders lists with minimal DOM operations
 *
 * Usage:
 *   repeat(items, item => item.id, item => html`<li>${item.name}</li>`)
 *
 * @param items - Array of items to render
 * @param keyFn - Function to extract unique key from each item
 * @param template - Template function to render each item
 */
export function repeat<T>(
	items: T[],
	keyFn: (item: T, index: number) => unknown,
	template: (item: T, index: number) => TemplateResult
): DirectiveResult {
	return {
		__directive: true,
		render(container: Node, previousState?: RepeatState): RepeatState {
			const parent = container.parentElement || container;

			// First render - setup markers
			if (!previousState) {
				const startMarker = document.createComment('repeat-start');
				const endMarker = document.createComment('repeat-end');

				parent.replaceChild(startMarker, container);
				parent.insertBefore(endMarker, startMarker.nextSibling);

				const state: RepeatState = {
					keyToIndex: new Map(),
					items: [],
					startMarker,
					endMarker
				};

				// Initial render
				updateList(items, keyFn, template, state);
				return state;
			}

			// Update existing list
			updateList(items, keyFn, template, previousState);
			return previousState;
		}
	};
}

function updateList<T>(
	newItems: T[],
	keyFn: (item: T, index: number) => unknown,
	template: (item: T, index: number) => TemplateResult,
	state: RepeatState
): void {
	const oldItems = state.items;
	const newKeyToIndex = new Map<unknown, number>();
	const newRepeatItems: RepeatItem[] = [];

	// Build new key map
	for (let i = 0; i < newItems.length; i++) {
		const key = keyFn(newItems[i], i);
		newKeyToIndex.set(key, i);
	}

	// Track which old items we can reuse
	const oldItemsToReuse = new Map<unknown, RepeatItem>();
	for (const oldItem of oldItems) {
		if (newKeyToIndex.has(oldItem.key)) {
			oldItemsToReuse.set(oldItem.key, oldItem);
		}
	}

	// Build new items list, reusing when possible
	for (let i = 0; i < newItems.length; i++) {
		const item = newItems[i];
		const key = keyFn(item, i);

		if (oldItemsToReuse.has(key)) {
			// Reuse existing item
			const oldItem = oldItemsToReuse.get(key)!;
			oldItemsToReuse.delete(key); // Mark as used

			// Re-render with new data
			const templateResult = template(item, i);
			templateResult.renderInto(oldItem.container);

			newRepeatItems.push(oldItem);
		} else {
			// Create new item
			const container = document.createDocumentFragment();
			const templateResult = template(item, i);
			templateResult.renderInto(container);

			const nodes = Array.from(container.childNodes);

			newRepeatItems.push({
				key,
				value: item,
				container,
				nodes
			});
		}
	}

	// Remove old items that are no longer needed
	for (const oldItem of oldItemsToReuse.values()) {
		oldItem.nodes.forEach(node => node.parentNode?.removeChild(node));
	}

	// Update DOM to match new order
	const parent = state.startMarker.parentElement!;
	const endMarker = state.endMarker;

	// Clear everything between markers
	let node = state.startMarker.nextSibling;
	while (node && node !== endMarker) {
		const next = node.nextSibling;
		parent.removeChild(node);
		node = next;
	}

	// Insert items in new order
	for (const item of newRepeatItems) {
		for (const node of item.nodes) {
			parent.insertBefore(node, endMarker);
		}
	}

	// Update state
	state.keyToIndex = newKeyToIndex;
	state.items = newRepeatItems;
}
