/**
 * Repeat directive - Efficient keyed list rendering
 */

import type { TemplateResult } from '../../classes/template-result.class';
import { disposeContainerParts } from '../../functions/dispose.functions';
import { renderDetachedItem } from '../../functions/render-detached.function';
import { clearBetweenBulk, restoreDirectiveContainer } from '../../functions/marker-range.functions';
import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';
import { devWarn, isDevMode } from '../../../devtools/dev-mode';

interface RepeatState {
	items: RepeatItem[];
	startMarker: Comment;
	endMarker: Comment;
	/** Disposal contract (see IDirectiveState) — releases every item's part tree. */
	__dispose: () => void;
}

interface RepeatItem {
	key: unknown;
	/**
	 * Holds the item's part tree. A NEW item's nodes also sit in here until the
	 * item is inserted; after that the live nodes are whatever lies between
	 * `start` and `end` — every removal/move walks that range.
	 */
	container: DocumentFragment;
	/**
	 * Always empty. Items used to keep a snapshot of the nodes they were
	 * created with until insertion; new items are now inserted straight from
	 * `container`, so there is nothing to snapshot. Kept (empty) because the
	 * state shape is observable through the part tree.
	 */
	nodes: Node[];
	start: Comment;
	end: Comment;
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
export function repeat<T>(items: T[], keyFn: (item: T, index: number) => unknown, template: (item: T, index: number) => TemplateResult): IDirectiveResult {
	return directive((container: Node, previousState?: RepeatState): RepeatState => {
		// First render - setup markers
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) {
				throw new Error('repeat() directive: container must be attached to a parent node');
			}

			const startMarker = document.createComment('repeat-start');
			const endMarker = document.createComment('repeat-end');

			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);

			const state: RepeatState = {
				items: [],
				startMarker,
				endMarker,
				__dispose: () => {
					for (const item of state.items) {
						disposeContainerParts(item.container);
					}
					state.items = [];
				}
			};

			// Initial render
			try {
				updateList(items, keyFn, template, state);
			} catch (error) {
				// keyFn or the item template threw before any state could be
				// handed back to the engine — undo the marker setup so the
				// next render can try again instead of failing forever.
				state.__dispose();
				restoreDirectiveContainer(container, startMarker, endMarker);
				throw error;
			}
			return state;
		}

		// Update existing list
		updateList(items, keyFn, template, previousState);
		return previousState;
	}, 'repeat');
}

function updateList<T>(
	newItems: T[],
	keyFn: (item: T, index: number) => unknown,
	template: (item: T, index: number) => TemplateResult,
	state: RepeatState
): void {
	const oldItems = state.items;

	// Compute every key ONCE. keyFn used to be called two or three times per
	// item per render (key map, fast-path check, reconciliation).
	const newKeys: unknown[] = new Array(newItems.length);
	for (let i = 0; i < newItems.length; i++) {
		newKeys[i] = keyFn(newItems[i], i);
	}

	// Quick check: if length and all keys are the same, skip expensive reconciliation
	if (oldItems.length === newItems.length) {
		let allKeysMatch = true;
		for (let i = 0; i < newItems.length; i++) {
			if (oldItems[i].key !== newKeys[i]) {
				allKeysMatch = false;
				break;
			}
		}
		if (allKeysMatch) {
			// Items are in same order with same keys - just update templates in place
			for (let i = 0; i < newItems.length; i++) {
				const templateResult = template(newItems[i], i);
				renderDetachedItem(templateResult, oldItems[i].container, oldItems[i].start, oldItems[i].end);
			}
			return;
		}
	}

	// The key set or order changed. (Duplicate detection lives here, on the
	// slow path and in dev only — it used to build a Map of every key on
	// every render, including renders where nothing had changed.)
	if (isDevMode()) {
		warnAboutDuplicateKeys(newKeys);
	}

	// The list was emptied: drop everything in one pass.
	if (newItems.length === 0) {
		removeAllItems(state);
		return;
	}

	// Track old items by key so we can reuse and remove efficiently. A key may
	// appear more than once in a malformed list, so each key holds a QUEUE:
	// every old item is then either reused or removed, never silently dropped.
	const oldItemsByKey = new Map<unknown, RepeatItem[]>();
	const oldIndexByKey = new Map<unknown, number>();
	for (let i = 0; i < oldItems.length; i++) {
		const oldItem = oldItems[i];
		const bucket = oldItemsByKey.get(oldItem.key);
		if (bucket) {
			bucket.push(oldItem);
		} else {
			oldItemsByKey.set(oldItem.key, [oldItem]);
			oldIndexByKey.set(oldItem.key, i);
		}
	}

	const newEntries: {
		item: RepeatItem;
		oldIndex: number;
		isNew: boolean;
	}[] = [];
	let reused = 0;

	// Build new items list, reusing when possible
	try {
		for (let i = 0; i < newItems.length; i++) {
			const item = newItems[i];
			const key = newKeys[i];
			const bucket = oldItemsByKey.get(key);

			if (bucket && bucket.length > 0) {
				// Reuse existing item
				const oldItem = bucket.shift()!;
				if (bucket.length === 0) {
					oldItemsByKey.delete(key);
				}

				// Re-render with new data
				const templateResult = template(item, i);
				renderDetachedItem(templateResult, oldItem.container, oldItem.start, oldItem.end);

				newEntries.push({
					item: oldItem,
					oldIndex: oldIndexByKey.get(key) ?? -1,
					isNew: false
				});
				reused++;
			} else {
				// Create new item
				const repeatItem = createRepeatItem(item, i, key, template);
				newEntries.push({
					item: repeatItem,
					oldIndex: -1,
					isNew: true
				});
			}
		}
	} catch (error) {
		// A template threw part-way through. Nothing has been inserted, moved
		// or removed yet and `state.items` is untouched, so the list is still
		// consistent; release the items created for this pass, which no one
		// will ever reach again.
		for (const entry of newEntries) {
			if (entry.isNew) {
				disposeContainerParts(entry.item.container);
			}
		}
		throw error;
	}

	// Remove old items that are no longer needed
	if (reused === 0 && oldItems.length > 0) {
		// Nothing survived (a full replace): the new items are not in the DOM
		// yet, so the whole range between the markers is old content.
		removeAllItems(state);
	} else {
		for (const bucket of oldItemsByKey.values()) {
			for (const oldItem of bucket) {
				removeItemRange(oldItem);
			}
		}
	}

	const lisPositions = reused > 0 ? getLisPositions(newEntries) : null;
	// parentNode, not parentElement: on first commit the markers may still sit
	// in the template's DocumentFragment (e.g. repeat() at the root of a template).
	const parent = state.startMarker.parentNode!;
	let nextSibling: Node = state.endMarker;

	// Walk backwards placing each item before the one after it. A run of
	// adjacent NEW items is gathered into one fragment and inserted with a
	// single DOM operation — creating 1,000 rows used to be 1,000 insertions
	// into the live tree (plus an intermediate fragment per row).
	let i = newEntries.length - 1;
	while (i >= 0) {
		const entry = newEntries[i];

		if (!entry.isNew) {
			if (!lisPositions!.has(i)) {
				moveItemRange(entry.item, nextSibling);
			}
			nextSibling = entry.item.start;
			i--;
			continue;
		}

		let runStart = i;
		while (runStart > 0 && newEntries[runStart - 1].isNew) {
			runStart--;
		}

		const fragment = document.createDocumentFragment();
		for (let j = runStart; j <= i; j++) {
			const item = newEntries[j].item;
			fragment.appendChild(item.start);
			// Appending the container moves its children; the (now empty)
			// fragment stays behind as the holder of the item's part tree.
			fragment.appendChild(item.container);
			fragment.appendChild(item.end);
		}
		parent.insertBefore(fragment, nextSibling);

		nextSibling = newEntries[runStart].item.start;
		i = runStart - 1;
	}

	// Update state
	const nextItems: RepeatItem[] = new Array(newEntries.length);
	for (let j = 0; j < newEntries.length; j++) {
		nextItems[j] = newEntries[j].item;
	}
	state.items = nextItems;
}

function warnAboutDuplicateKeys(keys: unknown[]): void {
	const seen = new Set<unknown>();

	for (const key of keys) {
		if (seen.has(key)) {
			// Keyed reconciliation addresses items BY key, so a repeated key means
			// one entry shadows the other: the shadowed item is neither reused nor
			// removed, and its DOM and part tree are orphaned on every render.
			devWarn(
				'repeat-duplicate-key',
				`repeat() received a duplicate key (${String(key)}). Keys must be unique — with a repeated key one item ` +
					'shadows the other, leaving orphaned DOM behind on every update. Use a key that is unique per item (an id, not an index into a filtered list).'
			);
			return;
		}
		seen.add(key);
	}
}

function createRepeatItem<T>(item: T, index: number, key: unknown, template: (item: T, index: number) => TemplateResult): RepeatItem {
	const templateResult = template(item, index);

	// Render into a container that retains the item's update parts. This lets
	// same-key items update their content in place on re-render (renderInto
	// diffs against the stored parts). A previous "compiled fast path" using
	// createDirect() produced no parts and silently dropped in-place updates —
	// correctness over the micro-optimization.
	const container = document.createDocumentFragment();
	templateResult.renderInto(container);

	return {
		key,
		container,
		nodes: [],
		start: document.createComment('repeat-item-start'),
		end: document.createComment('repeat-item-end')
	};
}

/** Dispose every item and clear the whole range between the list's markers. */
function removeAllItems(state: RepeatState): void {
	for (const item of state.items) {
		disposeContainerParts(item.container);
	}
	clearBetweenBulk(state.startMarker, state.endMarker);
	state.items = [];
}

function moveItemRange(item: RepeatItem, referenceNode: Node): void {
	const parent = referenceNode.parentNode;
	if (!parent) {
		return;
	}

	const fragment = document.createDocumentFragment();
	let node: Node | null = item.start;
	const end = item.end;

	while (node) {
		const nextNode: Node | null = node.nextSibling;
		fragment.appendChild(node);
		if (node === end) {
			break;
		}
		node = nextNode;
	}

	parent.insertBefore(fragment, referenceNode);
}

function removeItemRange(item: RepeatItem): void {
	// Recursively dispose the removed item's part tree so directive/action
	// cleanups registered inside the item template run before its nodes go away.
	disposeContainerParts(item.container);

	let node: Node | null = item.start;
	const end = item.end;

	while (node) {
		const nextNode: Node | null = node.nextSibling;
		node.parentNode?.removeChild(node);
		if (node === end) {
			break;
		}
		node = nextNode;
	}
}

function getLisPositions(
	entries: {
		item: RepeatItem;
		oldIndex: number;
		isNew: boolean;
	}[]
): Set<number> {
	const oldIndexSequence: number[] = [];
	const sequencePositions: number[] = [];

	for (let i = 0; i < entries.length; i++) {
		if (entries[i].oldIndex >= 0) {
			oldIndexSequence.push(entries[i].oldIndex);
			sequencePositions.push(i);
		}
	}

	const lisIndices = longestIncreasingSubsequence(oldIndexSequence);
	const lisPositions = new Set<number>();

	for (const seqIndex of lisIndices) {
		const position = sequencePositions[seqIndex];
		if (position !== undefined) {
			lisPositions.add(position);
		}
	}

	return lisPositions;
}

function longestIncreasingSubsequence(sequence: number[]): number[] {
	if (sequence.length === 0) {
		return [];
	}

	const predecessors = new Array<number>(sequence.length).fill(-1);
	const positions = new Array<number>(sequence.length).fill(0);
	let length = 0;

	for (let i = 0; i < sequence.length; i++) {
		const value = sequence[i];
		let low = 0;
		let high = length;

		while (low < high) {
			const mid = (low + high) >> 1;
			if (sequence[positions[mid]] < value) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}

		if (low > 0) {
			predecessors[i] = positions[low - 1];
		}

		positions[low] = i;

		if (low === length) {
			length++;
		}
	}

	const result = new Array<number>(length);
	let k = positions[length - 1];
	for (let i = length - 1; i >= 0; i--) {
		result[i] = k;
		k = predecessors[k];
	}

	return result;
}
