/**
 * RepeatTpl directive - Template-based repeat with near-raw performance
 *
 * Combines the declarative syntax of templates with the performance of repeatRaw
 * by defining the template once and only extracting values per item.
 */

import { directive } from '../functions/directive.function';
import type { IDirectiveResult } from '../interfaces/idirective-result.interface';

interface RepeatTplState {
	keyToItem: Map<unknown, { key: unknown; element: Element }>;
	startMarker: Comment;
	endMarker: Comment;
	factory: ElementFactory;
	attrs: TemplateDefinition['__tplAttrs'];
	textParts: TemplateDefinition['__tplTextParts'];
}

type ElementFactory = (values: unknown[]) => Element;

interface TemplateDefinition {
	__tplFactory: ElementFactory;
	__tplTag: string;
	__tplAttrs: Array<{ name: string; valueIndex: number | null; staticValue?: string }>;
	__tplEvents: Array<{ name: string; valueIndex: number }>;
	__tplTextParts: Array<{ static: string } | { valueIndex: number }>;
}

/**
 * Creates a reusable template definition for repeatTpl
 *
 * Usage:
 *   const itemTpl = tpl`<li class="${0}">${1}: ${2}</li>`;
 *
 *   // In template:
 *   repeatTpl(items, item => item.id, itemTpl, item => [
 *     item.active ? 'active' : '',
 *     item.text,
 *     item.value.toFixed(2)
 *   ])
 */
export function tpl(strings: TemplateStringsArray): TemplateDefinition {
	// Parse template structure once
	let html = strings[0];
	for (let i = 1; i < strings.length; i++) {
		html += `\${${i - 1}}` + strings[i];
	}

	// Extract tag, attributes, and text content
	const fullMatch = html.match(/^<([\w-]+)([^>]*)>(.*)$/s);
	if (!fullMatch) {
		throw new Error('tpl: Template must be a single element like <tag>...</tag>');
	}

	const [, tag, attrString, rest] = fullMatch;
	const closingTag = `</${tag}>`;

	if (!rest.endsWith(closingTag)) {
		throw new Error(`tpl: Template must end with closing tag </${tag}>`);
	}

	const textContent = rest.slice(0, -closingTag.length);

	// Parse attributes
	const attrs: TemplateDefinition['__tplAttrs'] = [];
	const attrRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\$\{(\d+)\})/g;
	let attrMatch;

	while ((attrMatch = attrRegex.exec(attrString)) !== null) {
		const name = attrMatch[1];
		const staticVal = attrMatch[2] ?? attrMatch[3];
		const dynamicIndex = attrMatch[4];

		if (dynamicIndex !== undefined) {
			attrs.push({ name, valueIndex: parseInt(dynamicIndex, 10) });
		} else if (staticVal !== undefined) {
			const placeholderMatch = staticVal.match(/\$\{(\d+)\}/);
			if (placeholderMatch) {
				attrs.push({ name, valueIndex: parseInt(placeholderMatch[1], 10) });
			} else {
				attrs.push({ name, valueIndex: null, staticValue: staticVal });
			}
		}
	}

	// Parse text content
	const textParts: TemplateDefinition['__tplTextParts'] = [];
	const placeholderRegex = /\$\{(\d+)\}/g;
	let lastIndex = 0;
	let textMatch;

	while ((textMatch = placeholderRegex.exec(textContent)) !== null) {
		if (textMatch.index > lastIndex) {
			textParts.push({ static: textContent.slice(lastIndex, textMatch.index) });
		}
		textParts.push({ valueIndex: parseInt(textMatch[1], 10) });
		lastIndex = textMatch.index + textMatch[0].length;
	}
	if (lastIndex < textContent.length) {
		textParts.push({ static: textContent.slice(lastIndex) });
	}

	// Create optimized factory function
	const factory: ElementFactory = (values: unknown[]): Element => {
		const el = document.createElement(tag);

		// Set attributes
		for (const attr of attrs) {
			if (attr.valueIndex !== null) {
				const value = values[attr.valueIndex];
				if (value != null && value !== false) {
					el.setAttribute(attr.name, value === true ? '' : String(value));
				}
			} else if (attr.staticValue !== undefined) {
				el.setAttribute(attr.name, attr.staticValue);
			}
		}

		// Build text content
		let text = '';
		for (const part of textParts) {
			if ('static' in part) {
				text += part.static;
			} else {
				text += values[part.valueIndex] ?? '';
			}
		}
		el.textContent = text;

		return el;
	};

	return {
		__tplFactory: factory,
		__tplTag: tag,
		__tplAttrs: attrs,
		__tplTextParts: textParts
	};
}

/**
 * High-performance list rendering with template syntax
 *
 * Usage:
 *   const itemTpl = tpl`<li class="${0}">${1}: ${2}</li>`;
 *
 *   repeatTpl(
 *     items,
 *     item => item.id,
 *     itemTpl,
 *     item => [item.active ? 'active' : '', item.text, item.value.toFixed(2)]
 *   )
 *
 * @param items - Array of items to render
 * @param keyFn - Function to extract unique key from each item
 * @param template - Template definition created with tpl``
 * @param valuesFn - Function to extract values array from each item
 */
export function repeatTpl<T>(
	items: T[],
	keyFn: (item: T, index: number) => unknown,
	template: TemplateDefinition,
	valuesFn: (item: T, index: number) => unknown[]
): IDirectiveResult {
	const factory = template.__tplFactory;

	return directive((container: Node, previousState?: RepeatTplState): RepeatTplState => {
		// First render - setup markers
		if (!previousState) {
			const parent = container.parentNode;
			if (!parent) {
				throw new Error('repeatTpl() directive: container must be attached to a parent node');
			}

			const startMarker = document.createComment('repeat-tpl-start');
			const endMarker = document.createComment('repeat-tpl-end');

			parent.replaceChild(startMarker, container);
			parent.insertBefore(endMarker, startMarker.nextSibling);

			const state: RepeatTplState = {
				keyToItem: new Map(),
				startMarker,
				endMarker,
				factory,
				attrs: template.__tplAttrs,
				textParts: template.__tplTextParts
			};

			// Initial render - create all elements directly
			const fragment = document.createDocumentFragment();
			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				const key = keyFn(item, i);
				const values = valuesFn(item, i);
				const element = factory(values);
				state.keyToItem.set(key, { key, element });
				fragment.appendChild(element);
			}
			parent.insertBefore(fragment, endMarker);

			return state;
		}

		// Update existing list
		updateList(items, keyFn, valuesFn, previousState);
		return previousState;
	});
}

function updateList<T>(
	newItems: T[],
	keyFn: (item: T, index: number) => unknown,
	valuesFn: (item: T, index: number) => unknown[],
	state: RepeatTplState
): void {
	const oldItems = state.keyToItem;
	const factory = state.factory;
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
			// Update elements in place - just update attributes and text
			i = 0;
			for (const [, { element }] of oldItems) {
				const item = newItems[i];
				const values = valuesFn(item, i);
				updateElement(element, values, state.attrs, state.textParts);
				i++;
			}
			return;
		}
	}

	// Full reconciliation
	const newKeyToItem = new Map<unknown, { key: unknown; element: Element }>();
	const fragment = document.createDocumentFragment();
	const usedKeys = new Set<unknown>();

	for (let i = 0; i < newItems.length; i++) {
		const item = newItems[i];
		const key = keyFn(item, i);
		const values = valuesFn(item, i);
		usedKeys.add(key);

		const existing = oldItems.get(key);
		if (existing) {
			// Update existing element
			updateElement(existing.element, values, state.attrs, state.textParts);
			newKeyToItem.set(key, existing);
			fragment.appendChild(existing.element);
		} else {
			// Create new element
			const element = factory(values);
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

	// Insert all at once
	parent.insertBefore(fragment, endMarker);
	state.keyToItem = newKeyToItem;
}

function updateElement(
	element: Element,
	values: unknown[],
	attrs: TemplateDefinition['__tplAttrs'],
	textParts: TemplateDefinition['__tplTextParts']
): void {
	// Update attributes
	for (const attr of attrs) {
		if (attr.valueIndex !== null) {
			const value = values[attr.valueIndex];
			if (value == null || value === false) {
				element.removeAttribute(attr.name);
			} else {
				element.setAttribute(attr.name, value === true ? '' : String(value));
			}
		}
	}

	// Update text content
	let text = '';
	for (const part of textParts) {
		if ('static' in part) {
			text += part.static;
		} else {
			text += values[part.valueIndex] ?? '';
		}
	}
	element.textContent = text;
}
