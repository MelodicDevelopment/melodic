/**
 * Repeat directive - Efficient keyed list rendering
 */

import type { TemplateResult } from '../../classes/template-result.class';
import { CompiledTemplate } from '../../classes/compiled-template.class';
import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

interface RepeatState {
	keyToIndex: Map<unknown, number>;
	items: RepeatItem[];
	startMarker: Comment;
	endMarker: Comment;
	compiledTemplate?: CompiledTemplate;
	useCompiledPath?: boolean;
}

interface RepeatItem {
	key: unknown;
	value: any;
	container: DocumentFragment;
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
	});
}

function updateList<T>(
	newItems: T[],
	keyFn: (item: T, index: number) => unknown,
	template: (item: T, index: number) => TemplateResult,
	state: RepeatState
): void {
	const oldItems = state.items;
	const newKeyToIndex = new Map<unknown, number>();
	const newEntries: {
		item: RepeatItem;
		oldIndex: number;
		isNew: boolean;
	}[] = [];

	// Build new key map
	for (let i = 0; i < newItems.length; i++) {
		const key = keyFn(newItems[i], i);
		newKeyToIndex.set(key, i);
	}

	// Quick check: if length and all keys are the same, skip expensive reconciliation
	if (oldItems.length === newItems.length) {
		let allKeysMatch = true;
		for (let i = 0; i < newItems.length; i++) {
			const key = keyFn(newItems[i], i);
			if (i >= oldItems.length || oldItems[i].key !== key) {
				allKeysMatch = false;
				break;
			}
		}
		if (allKeysMatch) {
			// Items are in same order with same keys - just update templates in place
			for (let i = 0; i < newItems.length; i++) {
				const templateResult = template(newItems[i], i);
				templateResult.renderInto(oldItems[i].container);
			}
			return;
		}
	}

	// On first render, check if we can use compiled fast path
	if (state.useCompiledPath === undefined && newItems.length > 0) {
		const sampleTemplate = template(newItems[0], 0);
		const compiled = CompiledTemplate.compile(sampleTemplate.strings);
		state.useCompiledPath = compiled.canUseFastPath();
		if (state.useCompiledPath) {
			state.compiledTemplate = compiled;
		}
	}

	// Track old items by key so we can reuse and remove efficiently
	const oldItemsByKey = new Map<unknown, RepeatItem>();
	const oldIndexByKey = new Map<unknown, number>();
	for (const oldItem of oldItems) {
		oldItemsByKey.set(oldItem.key, oldItem);
		oldIndexByKey.set(oldItem.key, oldIndexByKey.size);
	}

	// Build new items list, reusing when possible
	for (let i = 0; i < newItems.length; i++) {
		const item = newItems[i];
		const key = keyFn(item, i);

		if (oldItemsByKey.has(key)) {
			// Reuse existing item
			const oldItem = oldItemsByKey.get(key)!;
			oldItemsByKey.delete(key); // Mark as used

			// Re-render with new data
			const templateResult = template(item, i);
			templateResult.renderInto(oldItem.container);

			newEntries.push({
				item: oldItem,
				oldIndex: oldIndexByKey.get(key) ?? -1,
				isNew: false
			});
		} else {
			// Create new item
			const repeatItem = createRepeatItem(item, i, key, template, state);
			newEntries.push({
				item: repeatItem,
				oldIndex: -1,
				isNew: true
			});
		}
	}

	// Remove old items that are no longer needed
	for (const oldItem of oldItemsByKey.values()) {
		removeItemRange(oldItem);
	}

	if (newEntries.length === 0) {
		state.keyToIndex = newKeyToIndex;
		state.items = [];
		return;
	}

	const lisPositions = getLisPositions(newEntries);
	const parent = state.startMarker.parentElement!;
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
	state.keyToIndex = newKeyToIndex;
	state.items = newEntries.map((entry) => entry.item);
}

function createRepeatItem<T>(item: T, index: number, key: unknown, template: (item: T, index: number) => TemplateResult, state: RepeatState): RepeatItem {
	const templateResult = template(item, index);

	let nodes: Node[];
	let container: DocumentFragment;

	// Use compiled fast path if available
	if (state.useCompiledPath && state.compiledTemplate) {
		// Fast path: directly create element without DocumentFragment overhead
		const node = state.compiledTemplate.createDirect(templateResult.values);
		if (node) {
			nodes = [node];
			container = document.createDocumentFragment();
			container.appendChild(node);
		} else {
			// Fallback if createDirect fails
			container = document.createDocumentFragment();
			nodes = templateResult.renderOnce(container);
		}
	} else {
		container = document.createDocumentFragment();
		nodes = templateResult.renderOnce(container);
	}

	return {
		key,
		value: item,
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
