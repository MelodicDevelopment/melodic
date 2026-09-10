/**
 * Repeat directive - Efficient keyed list rendering
 */

import type { TemplateResult } from '../../classes/template-result.class';
import { disposeContainerParts } from '../../functions/dispose.functions';
import { renderDetachedItem } from '../../functions/render-detached.function';
import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';
import { devWarn } from '../../../devtools/dev-mode';

interface RepeatState {
	items: RepeatItem[];
	startMarker: Comment;
	endMarker: Comment;
	/** Disposal contract (see IDirectiveState) — releases every item's part tree. */
	__dispose: () => void;
}

interface RepeatItem {
	key: unknown;
	container: DocumentFragment;
	/**
	 * The nodes rendered when the item was CREATED — used only to insert a new
	 * item between its markers, then cleared so a later structure change
	 * inside the item does not keep the detached original subtree alive.
	 * Never a live list: every removal/move walks `start`..`end`.
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
			updateList(items, keyFn, template, state);
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
	// Only used to detect duplicates and to look items up by key while
	// reconciling; it is not kept on the state (nothing ever read it back).
	const newKeyToIndex = new Map<unknown, number>();
	const newEntries: {
		item: RepeatItem;
		oldIndex: number;
		isNew: boolean;
	}[] = [];

	// Compute every key ONCE. keyFn used to be called two or three times per
	// item per render (key map, fast-path check, reconciliation).
	const newKeys: unknown[] = new Array(newItems.length);
	let duplicateKey: unknown;
	let hasDuplicate = false;

	for (let i = 0; i < newItems.length; i++) {
		const key = keyFn(newItems[i], i);
		newKeys[i] = key;
		if (!hasDuplicate && newKeyToIndex.has(key)) {
			hasDuplicate = true;
			duplicateKey = key;
		}
		newKeyToIndex.set(key, i);
	}

	if (hasDuplicate) {
		// Keyed reconciliation addresses items BY key, so a repeated key means
		// one entry shadows the other: the shadowed item is neither reused nor
		// removed, and its DOM and part tree are orphaned on every render.
		devWarn(
			'repeat-duplicate-key',
			`repeat() received a duplicate key (${String(duplicateKey)}). Keys must be unique — with a repeated key one item ` +
				'shadows the other, leaving orphaned DOM behind on every update. Use a key that is unique per item (an id, not an index into a filtered list).'
		);
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

	// Build new items list, reusing when possible
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

	// Remove old items that are no longer needed
	for (const bucket of oldItemsByKey.values()) {
		for (const oldItem of bucket) {
			removeItemRange(oldItem);
		}
	}

	if (newEntries.length === 0) {
		state.items = [];
		return;
	}

	const lisPositions = getLisPositions(newEntries);
	// parentNode, not parentElement: on first commit the markers may still sit
	// in the template's DocumentFragment (e.g. repeat() at the root of a template).
	const parent = state.startMarker.parentNode!;
	let nextSibling: Node = state.endMarker;

	for (let i = newEntries.length - 1; i >= 0; i--) {
		const entry = newEntries[i];
		if (entry.isNew) {
			insertItemRange(entry.item, parent, nextSibling);
		} else if (!lisPositions.has(i)) {
			moveItemRange(entry.item, nextSibling);
		}
		nextSibling = entry.item.start;
	}

	// Update state
	state.items = newEntries.map((entry) => entry.item);
}

function createRepeatItem<T>(item: T, index: number, key: unknown, template: (item: T, index: number) => TemplateResult): RepeatItem {
	const templateResult = template(item, index);

	// Always render via renderOnce so the item's container retains its update
	// parts. This lets same-key items update their content in place on re-render
	// (renderInto diffs against the stored parts). A previous "compiled fast
	// path" using createDirect() produced no parts and silently dropped in-place
	// updates — correctness over the micro-optimization.
	const container = document.createDocumentFragment();
	const nodes = templateResult.renderOnce(container);

	return {
		key,
		container,
		nodes,
		start: document.createComment('repeat-item-start'),
		end: document.createComment('repeat-item-end')
	};
}

function insertItemRange(item: RepeatItem, parent: Node, referenceNode: Node): void {
	const fragment = document.createDocumentFragment();
	fragment.appendChild(item.start);
	for (const node of item.nodes) {
		fragment.appendChild(node);
	}
	fragment.appendChild(item.end);
	parent.insertBefore(fragment, referenceNode);
	item.nodes = [];
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
