/**
 * RepeatRaw directive - Maximum performance list rendering
 *
 * Bypasses the template system entirely for cases where raw DOM
 * performance is critical. Uses createElement instead of template cloning.
 */

import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

interface RepeatRawState {
	keyToItem: Map<unknown, { key: unknown; element: Element }>;
	startMarker: Comment;
	endMarker: Comment;
}

/**
 * High-performance list rendering using raw DOM APIs
 *
 * Usage:
 *   repeatRaw(items, item => item.id, item => {
 *     const li = document.createElement('li');
 *     li.className = item.active ? 'active' : '';
 *     li.textContent = `${item.text}: ${item.value}`;
 *     return li;
 *   })
 *
 * @param items - Array of items to render
 * @param keyFn - Function to extract unique key from each item
 * @param factory - Factory function that creates a DOM element for each item
 */
export function repeatRaw<T>(
	items: T[],
	keyFn: (item: T, index: number) => unknown,
	factory: (item: T, index: number) => Element
): IDirectiveResult {
	return directive((container: Node, previousState?: RepeatRawState): RepeatRawState => {
		// First render - setup markers
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) {
				throw new Error('repeatRaw() directive: container must be attached to a parent node');
			}

			const startMarker = document.createComment('repeat-raw-start');
			const endMarker = document.createComment('repeat-raw-end');

			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);

			const state: RepeatRawState = {
				keyToItem: new Map(),
				startMarker,
				endMarker
			};

			// Initial render - create all elements
			const fragment = document.createDocumentFragment();
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const key = keyFn(item, i);
				const element = factory(item, i);
				state.keyToItem.set(key, { key, element });
				fragment.appendChild(element);
			}
			parent.insertBefore(fragment, endMarker);

			return state;
		}

		// Update existing list
		updateList(items, keyFn, factory, previousState);
		return previousState;
	});
}

function updateList<T>(
	newItems: T[],
	keyFn: (item: T, index: number) => unknown,
	factory: (item: T, index: number) => Element,
	state: RepeatRawState
): void {
	const oldItems = state.keyToItem;
	const newKeyToItem = new Map<unknown, { key: unknown; element: Element }>();
	const parent = state.startMarker.parentElement!;
	const endMarker = state.endMarker;

	// Quick path: same length, same keys in order - just update in place
	if (oldItems.size === newItems.length) {
		let allMatch = true;
		let i = 0;
		for (const [key] of oldItems) {
			if (key !== keyFn(newItems[i], i)) {
				allMatch = false;
				break;
			}
			i++;
		}

		if (allMatch) {
			// Update elements in place
			i = 0;
			for (const [key, { element }] of oldItems) {
				const item = newItems[i];
				// Re-create element with new data (factory handles updates)
				const newElement = factory(item, i);
				if (element !== newElement) {
					element.replaceWith(newElement);
					newKeyToItem.set(key, { key, element: newElement });
				} else {
					newKeyToItem.set(key, { key, element });
				}
				i++;
			}
			state.keyToItem = newKeyToItem;
			return;
		}
	}

	// Full reconciliation
	const fragment = document.createDocumentFragment();
	const usedKeys = new Set<unknown>();

	for (let i = 0; i < newItems.length; i++) {
		const item = newItems[i];
		const key = keyFn(item, i);
		usedKeys.add(key);

		const existing = oldItems.get(key);
		if (existing) {
			// Update existing element
			const newElement = factory(item, i);
			if (existing.element !== newElement) {
				// Factory returned a new element, use it
				newKeyToItem.set(key, { key, element: newElement });
				fragment.appendChild(newElement);
			} else {
				newKeyToItem.set(key, existing);
				fragment.appendChild(existing.element);
			}
		} else {
			// Create new element
			const element = factory(item, i);
			newKeyToItem.set(key, { key, element });
			fragment.appendChild(element);
		}
	}

	// Remove unused elements
	for (const [key, { element }] of oldItems) {
		if (!usedKeys.has(key)) {
			element.remove();
		}
	}

	// Replace all content
	parent.insertBefore(fragment, endMarker);

	state.keyToItem = newKeyToItem;
}
