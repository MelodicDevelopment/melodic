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
	const newRepeatItems: RepeatItem[] = [];

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
	for (const oldItem of oldItems) {
		oldItemsByKey.set(oldItem.key, oldItem);
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

			newRepeatItems.push(oldItem);
		} else {
			// Create new item
			const templateResult = template(item, i);

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

			newRepeatItems.push({
				key,
				value: item,
				container,
				nodes
			});
		}
	}

	// Remove old items that are no longer needed
	for (const oldItem of oldItemsByKey.values()) {
		oldItem.nodes.forEach((node) => node.parentNode?.removeChild(node));
	}

	// Update DOM to match new order
	const parent = state.startMarker.parentElement!;
	const endMarker = state.endMarker;
	const fragment = document.createDocumentFragment();

	for (const item of newRepeatItems) {
		for (const node of item.nodes) {
			fragment.appendChild(node);
		}
	}

	parent.insertBefore(fragment, endMarker);

	// Update state
	state.keyToIndex = newKeyToIndex;
	state.items = newRepeatItems;
}
