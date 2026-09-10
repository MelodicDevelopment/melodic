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
 * With an `update` callback, elements for keys seen before are updated in
 * place and keep their DOM identity (focus, scroll position, animations);
 * `factory` then only runs for new keys:
 *   repeatRaw(items, item => item.id, createRow, (el, item) => { el.textContent = item.text; })
 *
 * Without `update`, `factory` runs for every item on every render and the
 * element it returns replaces the previous one for that key.
 *
 * @param items - Array of items to render
 * @param keyFn - Function to extract unique key from each item
 * @param factory - Creates a DOM element for an item
 * @param update - Optional: updates an existing element for an item in place
 */
export function repeatRaw<T>(
	items: T[],
	keyFn: (item: T, index: number) => unknown,
	factory: (item: T, index: number) => Element,
	update?: (element: Element, item: T, index: number) => void
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
		updateList(items, keyFn, factory, update, previousState);
		return previousState;
	}, 'repeatRaw');
}

function updateList<T>(
	newItems: T[],
	keyFn: (item: T, index: number) => unknown,
	factory: (item: T, index: number) => Element,
	update: ((element: Element, item: T, index: number) => void) | undefined,
	state: RepeatRawState
): void {
	const oldItems = state.keyToItem;
	const newKeyToItem = new Map<unknown, { key: unknown; element: Element }>();
	const parent = state.startMarker.parentNode!;
	const endMarker = state.endMarker;

	/** Reuse (update in place) or rebuild the element for a key seen before. */
	const reuse = (existing: { key: unknown; element: Element }, item: T, index: number): Element => {
		if (update) {
			update(existing.element, item, index);
			return existing.element;
		}

		const next = factory(item, index);
		if (next !== existing.element) {
			// The factory built a replacement: the old element must not linger
			// in the DOM (or in the map) alongside it.
			existing.element.replaceWith(next);
		}
		return next;
	};

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
			i = 0;
			for (const [key, existing] of oldItems) {
				newKeyToItem.set(key, { key, element: reuse(existing, newItems[i], i) });
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
			const element = reuse(existing, item, i);
			newKeyToItem.set(key, { key, element });
			fragment.appendChild(element);
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
