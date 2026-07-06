import { getAttributeDirective } from '../directives/functions/attribute-directive.functions';
import type { ITemplatePart, IKeyedArrayItem, IEventHandlerWithOptions } from '../interfaces/itemplate-part.interface';
import type { ITemplateCache, IPartPath } from '../interfaces/itemplate-cache.interface';
import type { IDirectiveState } from '../interfaces/idirective-state.interface';
import type { RenderedContainer } from '../interfaces/irendered-container.interface';
import { isDirective } from '../directives/functions/is-directive.function';
import { disposeParts, disposeContainerParts, disposeDirectiveState } from '../functions/dispose.functions';

// Unique marker for identifying dynamic positions
const MARKER = `m${Math.random().toString(36).slice(2, 9)}`;
const COMMENT_NODE_MARKER = `<!--${MARKER}-->`;
const ATTRIBUTE_MARKER_PREFIX = `__${MARKER}_`;
const ATTRIBUTE_MARKER_REGEX = new RegExp(`${ATTRIBUTE_MARKER_PREFIX}(\\d+)__`, 'g');

const createAttributeMarker = (index: number): string => `${ATTRIBUTE_MARKER_PREFIX}${index}__`;

const templateCache = new Map<string, ITemplateCache>();

// Dev-mode warning (once per property name) for property bindings that assign
// raw HTML — .innerHTML=${...} looks like a normal bind but bypasses the safe
// text path entirely.
const warnedUnsafeProperties = new Set<string>();
function warnUnsafePropertyBinding(name: string): void {
	if (warnedUnsafeProperties.has(name)) return;
	if (typeof import.meta !== 'undefined' && import.meta.env && !import.meta.env.DEV) return;
	warnedUnsafeProperties.add(name);
	console.warn(
		`[melodic] Property binding ".${name}" assigns raw HTML and is an XSS hazard if the value is not fully trusted. ` +
			'Prefer text interpolation, or unsafeHTML() with sanitized content.'
	);
}

/**
 * Extract listener options (capture/once/passive) from a `handleEvent`-object
 * binding value. Returns undefined when no option flag is present, so plain
 * handleEvent objects register exactly like plain functions.
 */
function extractListenerOptions(value: IEventHandlerWithOptions): AddEventListenerOptions | undefined {
	const { capture, once, passive } = value;
	if (capture === undefined && once === undefined && passive === undefined) {
		return undefined;
	}

	const options: AddEventListenerOptions = {};
	if (capture !== undefined) options.capture = capture;
	if (once !== undefined) options.once = once;
	if (passive !== undefined) options.passive = passive;
	return options;
}

/** Compare listener options by effective (boolean) value. */
function sameListenerOptions(a: AddEventListenerOptions | undefined, b: AddEventListenerOptions | undefined): boolean {
	return !!a?.capture === !!b?.capture && !!a?.once === !!b?.once && !!a?.passive === !!b?.passive;
}

// Cache template keys by TemplateStringsArray identity to avoid repeated string joins
const templateKeyCache = new WeakMap<TemplateStringsArray, string>();

/**
 * Get or create a cache key for the template strings array.
 * Uses WeakMap to cache by object identity, avoiding expensive string joins on repeated renders.
 */
function getTemplateKey(strings: TemplateStringsArray): string {
	let key = templateKeyCache.get(strings);
	if (key === undefined) {
		key = strings.join(MARKER);
		templateKeyCache.set(strings, key);
	}
	return key;
}

export class TemplateResult {
	public strings: TemplateStringsArray;
	public values: unknown[];

	constructor(strings: TemplateStringsArray, values: unknown[]) {
		this.strings = strings;
		this.values = values;
	}

	/**
	 * Structural identity of this template (derived from its tagged template
	 * literal). Two TemplateResults with the same key share DOM structure and
	 * can be updated in place; different keys require a rebuild.
	 */
	public get templateKey(): string {
		return getTemplateKey(this.strings);
	}

	/**
	 * Optimized render for single-use containers (like repeat items).
	 * Returns the rendered nodes directly.
	 */
	public renderOnce(container: DocumentFragment): Node[] {
		const target = container as RenderedContainer<DocumentFragment>;
		const templateKey = getTemplateKey(this.strings);
		const cache = this.getTemplate(templateKey);
		const clone = cache.element.content.cloneNode(true);
		const parts = this.prepareParts(clone, cache);

		this.commit(parts);
		target.appendChild(clone);

		target.__parts = parts;
		target.__templateKey = templateKey;

		return Array.from(target.childNodes);
	}

	public renderInto(container: Element | DocumentFragment): void {
		const target = container as RenderedContainer<Element | DocumentFragment>;
		const templateKey = getTemplateKey(this.strings);

		// Get or create template
		const { element: template } = this.getTemplate(templateKey);

		// First render - clone and prepare
		const existingKey = target.__templateKey;
		if (existingKey && existingKey !== templateKey) {
			// Structure changed — recursively dispose the old part tree before
			// the container is wiped and rebuilt.
			if (target.__parts) {
				disposeParts(target.__parts);
			}
			delete target.__parts;
		}

		if (!target.__parts) {
			const clone = template.content.cloneNode(true);
			const parts = this.prepareParts(clone, this.getTemplate(templateKey));

			target.__parts = parts;
			target.__templateKey = templateKey;

			// Commit values BEFORE appending to DOM so attributes are set
			// before connectedCallback fires on child custom elements
			this.commit(parts);

			target.textContent = '';
			target.appendChild(clone);
			return;
		}

		// Update values
		if (!target.__templateKey) {
			target.__templateKey = templateKey;
		}
		this.commit(target.__parts);
	}

	private getTemplate(key: string): ITemplateCache {
		let cached = templateCache.get(key);

		if (cached) {
			// LRU: refresh recency so eviction removes the least recently USED
			// template, not the least recently created one.
			templateCache.delete(key);
			templateCache.set(key, cached);
			return cached;
		}

		const parts: ITemplatePart[] = [];
		let html = this.strings[0];

		const attrPreProcessor = this.getAttributePreProcessor(parts);
		let activeAttributeName: string | null = null;
		let activeAttributeQuote: string | null = null;

		for (let i = 1; i < this.strings.length; i++) {
			const s = this.strings[i];
			const valueIndex = i - 1;

			const match = /([@.:?]?[\w:-]+)\s*=\s*["']?$/.exec(html);
			const quotedAttrMatch = /([@.:?]?[\w:-]+)\s*=\s*(["'])([^"']*)$/.exec(html);
			let attrKey: string = '___';

			if (activeAttributeName) {
				html += createAttributeMarker(valueIndex);
			} else {
				const quotedName = quotedAttrMatch?.[1];
				const quotedPrefix = quotedName?.charAt(0);
				const hasSpecialPrefix = quotedPrefix !== undefined && Object.keys(attrPreProcessor).includes(quotedPrefix);

				if (quotedAttrMatch && !hasSpecialPrefix) {
					html += createAttributeMarker(valueIndex);
					activeAttributeName = quotedAttrMatch[1];
					activeAttributeQuote = quotedAttrMatch[2];
				} else {
					if (match) {
						attrKey = '__';
						const attrPrefix: string = match[1].charAt(0);

						if (Object.keys(attrPreProcessor).includes(attrPrefix)) {
							attrKey = attrPrefix;
						}
					}

					if (attrKey === '__' && match) {
						html += createAttributeMarker(valueIndex);
						activeAttributeName = match[1];
						const quoteMatch = /(["'])$/.exec(match[0]);
						activeAttributeQuote = quoteMatch ? quoteMatch[1] : null;
					} else {
						html = attrPreProcessor[attrKey](valueIndex, html, match ? match[1] : undefined, match);
					}
				}
			}
			html += s;

			if (activeAttributeName) {
				if (activeAttributeQuote) {
					if (s.includes(activeAttributeQuote)) {
						activeAttributeName = null;
						activeAttributeQuote = null;
					}
				} else if (/[\s>]/.test(s)) {
					activeAttributeName = null;
					activeAttributeQuote = null;
				}
			}
		}

		const element = document.createElement('template');
		element.innerHTML = html;

		// Pre-compute part paths by walking template DOM once
		const partPaths: IPartPath[] = [];
		let nodePartCursor = 0;

		// Build lookup for node parts by index order
		const nodeParts: ITemplatePart[] = [];
		const eventPartsByIndex = new Map<number, ITemplatePart>();
		const propertyPartsByIndex = new Map<number, ITemplatePart>();
		const actionPartsByIndex = new Map<number, ITemplatePart>();
		const booleanPartsByIndex = new Map<number, ITemplatePart>();

		for (const part of parts) {
			switch (part.type) {
				case 'event':
					eventPartsByIndex.set(part.index, part);
					break;
				case 'property':
					propertyPartsByIndex.set(part.index, part);
					break;
				case 'action':
					actionPartsByIndex.set(part.index, part);
					break;
				case 'boolean-attribute':
					booleanPartsByIndex.set(part.index, part);
					break;
				case 'node':
					nodeParts.push(part);
					break;
				default:
					break;
			}
		}

		// Walk template content once to record paths
		const walkTemplate = (node: Node, path: number[]) => {
			if (node.nodeType === Node.COMMENT_NODE) {
				const comment = node as Comment;
				if (comment.data === MARKER) {
					const part = nodeParts[nodePartCursor++];
					if (part) {
						partPaths.push({
							path: [...path],
							type: 'node',
							index: part.index
						});
					}
				}
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as Element;

				// Check attributes for markers
				for (let i = el.attributes.length - 1; i >= 0; i--) {
					const attr = el.attributes[i];

					if (attr.name.startsWith('__event-')) {
						const index = parseInt(attr.name.match(/__event-(\d+)__/)?.[1] || '0');
						const part = eventPartsByIndex.get(index);
						if (part) {
							partPaths.push({
								path: [...path],
								type: 'event',
								index: part.index,
								name: part.name
							});
						}
					} else if (attr.name.startsWith('__prop-')) {
						const index = parseInt(attr.name.match(/__prop-(\d+)__/)?.[1] || '0');
						const part = propertyPartsByIndex.get(index);
						if (part) {
							partPaths.push({
								path: [...path],
								type: 'property',
								index: part.index,
								name: part.name
							});
						}
					} else if (attr.name.startsWith('__action-')) {
						const index = parseInt(attr.name.match(/__action-(\d+)__/)?.[1] || '0');
						const part = actionPartsByIndex.get(index);
						if (part) {
							partPaths.push({
								path: [...path],
								type: 'action',
								index: part.index,
								name: part.name
							});
						}
					} else if (attr.name.startsWith('__bool-')) {
						const index = parseInt(attr.name.match(/__bool-(\d+)__/)?.[1] || '0');
						const part = booleanPartsByIndex.get(index);
						if (part) {
							partPaths.push({
								path: [...path],
								type: 'boolean-attribute',
								index: part.index,
								name: part.name
							});
						}
					} else if (attr.name.startsWith(':')) {
						// Static action directive
						partPaths.push({
							path: [...path],
							type: 'action',
							index: -1,
							name: attr.name.slice(1),
							staticValue: attr.value
						});
					} else if (attr.value.includes(ATTRIBUTE_MARKER_PREFIX)) {
						const attributeInfo = this.parseAttributeValue(attr.value);
						if (attributeInfo) {
							const isComposite = attributeInfo.indices.length > 1 || attributeInfo.strings.some((s) => s.length > 0);
							partPaths.push({
								path: [...path],
								type: 'attribute',
								index: attributeInfo.indices[0],
								name: attr.name,
								attributeStrings: isComposite ? attributeInfo.strings : undefined,
								attributeIndices: isComposite ? attributeInfo.indices : undefined
							});
						}
					}
				}
			}

			// Walk children
			const children = node.childNodes;
			for (let i = 0; i < children.length; i++) {
				path.push(i);
				walkTemplate(children[i], path);
				path.pop();
			}
		};

		walkTemplate(element.content, []);

		cached = { element, parts, partPaths };
		if (templateCache.size >= 500) {
			const oldestKey = templateCache.keys().next().value;
			if (oldestKey) {
				templateCache.delete(oldestKey);
			}
		}
		templateCache.set(key, cached);

		return cached;
	}

	private getAttributePreProcessor(
		parts: ITemplatePart[]
	): Record<string, (index: number, html: string, attrName?: string, match?: RegExpExecArray | null) => string> {
		return {
			'@': (index: number, html: string, attrName?: string, match?: RegExpExecArray | null) => {
				// Event binding
				parts.push({
					type: 'event',
					index: index,
					name: attrName?.slice(1)
				});
				return html.slice(0, -(match?.[0].length ?? 0)) + `__event-${index}__=""`;
			},
			'.': (index: number, html: string, attrName?: string, match?: RegExpExecArray | null) => {
				// Property binding
				parts.push({
					type: 'property',
					index: index,
					name: attrName?.slice(1)
				});
				return html.slice(0, -(match?.[0].length ?? 0)) + `__prop-${index}__=""`;
			},
			':': (index: number, html: string, attrName?: string, match?: RegExpExecArray | null) => {
				// Action directive binding
				parts.push({
					type: 'action',
					index: index,
					name: attrName?.slice(1)
				});
				return html.slice(0, -(match?.[0].length ?? 0)) + `__action-${index}__=""`;
			},
			'?': (index: number, html: string, attrName?: string, match?: RegExpExecArray | null) => {
				// Boolean attribute binding
				parts.push({
					type: 'boolean-attribute',
					index: index,
					name: attrName?.slice(1)
				});
				return html.slice(0, -(match?.[0].length ?? 0)) + `__bool-${index}__=""`;
			},
			'__': (index: number, html: string, _?: string) => {
				// Regular attribute
				return html + createAttributeMarker(index);
			},
			'___': (index: number, html: string) => {
				// Text position
				parts.push({
					type: 'node',
					index: index
				});
				return html + COMMENT_NODE_MARKER;
			}
		};
	}

	private prepareParts(clone: Node, cache: ITemplateCache): ITemplatePart[] {
		const parts: ITemplatePart[] = [];
		const { partPaths } = cache;

		// Navigate directly to each part using pre-computed paths
		for (const partPath of partPaths) {
			// Navigate to the node using the path
			let node: Node = clone;
			for (const index of partPath.path) {
				node = node.childNodes[index];
			}

			if (partPath.type === 'node') {
				// Replace comment marker with text node
				const textNode = document.createTextNode('');
				node.parentNode!.replaceChild(textNode, node);

				parts.push({
					type: 'node',
					index: partPath.index,
					node: textNode
				});
			} else if (partPath.type === 'event') {
				const element = node as Element;
				element.removeAttribute(`__event-${partPath.index}__`);

				parts.push({
					type: 'event',
					index: partPath.index,
					name: partPath.name,
					node: element
				});
			} else if (partPath.type === 'property') {
				const element = node as Element;
				element.removeAttribute(`__prop-${partPath.index}__`);

				parts.push({
					type: 'property',
					index: partPath.index,
					name: partPath.name,
					node: element
				});
			} else if (partPath.type === 'action') {
				const element = node as Element;

				if (partPath.index >= 0) {
					element.removeAttribute(`__action-${partPath.index}__`);
				} else {
					// Static action directive
					element.removeAttribute(`:${partPath.name}`);
				}

				parts.push({
					type: 'action',
					index: partPath.index,
					name: partPath.name,
					node: element,
					staticValue: partPath.staticValue
				});
			} else if (partPath.type === 'boolean-attribute') {
				const element = node as Element;
				element.removeAttribute(`__bool-${partPath.index}__`);

				parts.push({
					type: 'boolean-attribute',
					index: partPath.index,
					name: partPath.name,
					node: element
				});
			} else if (partPath.type === 'attribute') {
				const element = node as Element;
				element.removeAttribute(partPath.name!);

				parts.push({
					type: 'attribute',
					index: partPath.index,
					name: partPath.name,
					node: element,
					attributeStrings: partPath.attributeStrings,
					attributeIndices: partPath.attributeIndices
				});
			}
		}

		return parts;
	}

	private parseAttributeValue(value: string): { strings: string[]; indices: number[] } | null {
		const strings: string[] = [];
		const indices: number[] = [];
		let lastIndex = 0;
		let match: RegExpExecArray | null;

		ATTRIBUTE_MARKER_REGEX.lastIndex = 0;
		while ((match = ATTRIBUTE_MARKER_REGEX.exec(value)) !== null) {
			strings.push(value.slice(lastIndex, match.index));
			indices.push(Number(match[1]));
			lastIndex = match.index + match[0].length;
		}

		if (indices.length === 0) {
			return null;
		}

		strings.push(value.slice(lastIndex));
		return { strings, indices };
	}

	/**
	 * Sets up markers for a node part to enable complex content rendering
	 */
	private ensureMarkers(part: ITemplatePart): void {
		if (part.startMarker) return; // Already set up

		const parent = part.node!.parentNode;
		if (!parent) return;

		const startMarker = document.createComment('part-start');
		const endMarker = document.createComment('part-end');

		parent.insertBefore(startMarker, part.node!);
		parent.insertBefore(endMarker, part.node!.nextSibling);

		part.startMarker = startMarker;
		part.endMarker = endMarker;
	}

	/**
	 * Clears previously rendered nodes between markers, recursively disposing
	 * the nested part trees (directive/action cleanups) they own.
	 */
	private clearRenderedNodes(part: ITemplatePart): void {
		// Dispose nested part trees BEFORE dropping the references, so cleanups
		// registered anywhere in the removed content actually run.
		if (part.nestedContainer) {
			disposeContainerParts(part.nestedContainer);
			part.nestedContainer = undefined;
		}

		if (part.renderedContainers) {
			for (const container of part.renderedContainers) {
				disposeContainerParts(container);
			}
			part.renderedContainers = undefined;
		}

		if (part.arrayState) {
			for (const item of part.arrayState.items.values()) {
				disposeContainerParts(item.container);
			}
			part.arrayState = undefined;
		}

		if (part.renderedNodes && part.renderedNodes.length > 0) {
			for (const node of part.renderedNodes) {
				node.parentNode?.removeChild(node);
			}
		}
		part.renderedNodes = [];
	}

	/**
	 * Clears DOM nodes created by a directive (e.g. repeat, when) when
	 * switching away from a directive to a different renderable type.
	 * Removes all nodes between the directive's markers and restores
	 * part.node into the DOM so non-directive rendering can proceed.
	 */
	private clearDirectiveDOM(part: ITemplatePart): void {
		const state = part.directiveState;
		if (!state) return;

		// Recursively dispose resources owned by the directive state (nested
		// part trees, subscriptions) before its DOM is removed.
		disposeDirectiveState(state);

		if (typeof state !== 'object') {
			part.directiveState = undefined;
			part.directiveType = undefined;
			return;
		}

		// Directive markers (repeat/when both use startMarker/endMarker)
		const { startMarker, endMarker } = state as IDirectiveState;

		if (startMarker && endMarker && startMarker.parentNode) {
			const parent = startMarker.parentNode;

			// Remove all nodes between markers (exclusive)
			let node = startMarker.nextSibling;
			while (node && node !== endMarker) {
				const next = node.nextSibling;
				parent.removeChild(node);
				node = next;
			}

			// Restore part.node before the end marker so non-directive
			// rendering has a valid text node to work with
			if (part.node) {
				parent.insertBefore(part.node, endMarker);
			}

			// Remove the directive markers themselves
			parent.removeChild(startMarker);
			parent.removeChild(endMarker);
		}

		part.directiveState = undefined;
		part.directiveType = undefined;
	}

	/**
	 * Renders a nested TemplateResult into a node part.
	 *
	 * Uses a persistent DocumentFragment container to enable in-place updates
	 * when the template structure hasn't changed (same tagged template literal).
	 * This follows the same pattern as the `when` directive — the fragment holds
	 * __parts/__templateKey after its children move to the real DOM, so subsequent
	 * renderInto() calls diff and update existing nodes instead of recreating them.
	 */
	private renderNestedTemplate(part: ITemplatePart, template: TemplateResult): void {
		this.ensureMarkers(part);

		// Reuse existing container for same template structure (avoids destroying/recreating DOM)
		if (part.nestedContainer) {
			const existingKey = (part.nestedContainer as RenderedContainer<DocumentFragment>).__templateKey;

			if (existingKey === getTemplateKey(template.strings)) {
				// Same structure — update existing DOM nodes in place
				template.renderInto(part.nestedContainer);
				return;
			}
		}

		// First render or template structure changed — clearRenderedNodes
		// recursively disposes the old nested part tree before removal.
		this.clearRenderedNodes(part);
		part.node!.textContent = '';

		const container = document.createDocumentFragment();
		template.renderInto(container);
		part.nestedContainer = container;

		const nodes = Array.from(container.childNodes);
		part.renderedNodes = nodes;

		const parent = part.endMarker!.parentNode!;
		parent.insertBefore(container, part.endMarker!);
	}

	/**
	 * Renders a DOM Node into a node part
	 */
	private renderNode(part: ITemplatePart, node: Node): void {
		this.ensureMarkers(part);
		this.clearRenderedNodes(part);

		// Hide the original text node
		part.node!.textContent = '';

		part.renderedNodes = [node];

		const parent = part.endMarker!.parentNode!;
		parent.insertBefore(node, part.endMarker!);
	}

	/**
	 * Renders an array of values into a node part
	 */
	private renderArray(part: ITemplatePart, values: unknown[]): void {
		this.ensureMarkers(part);

		// Hide the original text node
		part.node!.textContent = '';

		const parent = part.endMarker!.parentNode!;
		const keyedValues = this.getKeyedValues(values);

		if (keyedValues) {
			const state = part.arrayState ?? {
				items: new Map<unknown, IKeyedArrayItem>(),
				keys: []
			};

			const newItems = new Map<unknown, IKeyedArrayItem>();
			const newKeys: unknown[] = [];

			for (const item of keyedValues) {
				const existing = state.items.get(item.key);
				if (existing) {
					this.updateArrayItem(existing, item.value, parent, part.endMarker!);
					newItems.set(item.key, existing);
				} else {
					const created = this.createArrayItem(item.value, parent, part.endMarker!);
					newItems.set(item.key, {
						key: item.key,
						value: item.value,
						container: created.container,
						nodes: created.nodes
					});
				}
				newKeys.push(item.key);
			}

			for (const [key, oldItem] of state.items.entries()) {
				if (!newItems.has(key)) {
					// Dispose the removed item's part tree before removing its nodes.
					disposeContainerParts(oldItem.container);
					for (const node of oldItem.nodes) {
						node.parentNode?.removeChild(node);
					}
				}
			}

			let referenceNode = part.startMarker!.nextSibling;
			for (const key of newKeys) {
				const item = newItems.get(key)!;
				for (const node of item.nodes) {
					if (node === referenceNode) {
						referenceNode = referenceNode?.nextSibling ?? null;
						continue;
					}
					parent.insertBefore(node, referenceNode ?? part.endMarker!);
				}
			}

			part.arrayState = {
				items: newItems,
				keys: newKeys
			};
			part.renderedNodes = newKeys.flatMap((key) => newItems.get(key)!.nodes);
			return;
		}

		this.clearRenderedNodes(part);
		const renderedNodes: Node[] = [];
		const renderedContainers: DocumentFragment[] = [];

		for (const value of values) {
			if (value instanceof TemplateResult) {
				const fragment = document.createDocumentFragment();
				value.renderInto(fragment);
				const nodes = Array.from(fragment.childNodes);
				renderedNodes.push(...nodes);
				// Retain the container so its part tree can be disposed when the
				// (non-keyed) array re-renders or the part is discarded.
				renderedContainers.push(fragment);
				parent.insertBefore(fragment, part.endMarker!);
			} else if (value instanceof Node) {
				renderedNodes.push(value);
				parent.insertBefore(value, part.endMarker!);
			} else if (value !== null && value !== undefined) {
				const textNode = document.createTextNode(String(value));
				renderedNodes.push(textNode);
				parent.insertBefore(textNode, part.endMarker!);
			}
		}

		part.renderedNodes = renderedNodes;
		part.renderedContainers = renderedContainers.length > 0 ? renderedContainers : undefined;
	}

	private getKeyedValues(values: unknown[]): Array<{ key: unknown; value: unknown }> | null {
		if (values.length === 0) {
			return null;
		}

		const keyedValues: Array<{ key: unknown; value: unknown }> = [];
		for (const value of values) {
			if (value && typeof value === 'object' && (value as { __keyed?: boolean }).__keyed === true) {
				const keyed = value as { key: unknown; value: unknown };
				keyedValues.push({ key: keyed.key, value: keyed.value });
			} else {
				return null;
			}
		}

		return keyedValues;
	}

	private createArrayItem(value: unknown, parent: Node, endMarker: Comment): { container: DocumentFragment; nodes: Node[] } {
		const container = document.createDocumentFragment();
		if (value instanceof TemplateResult) {
			value.renderInto(container);
		} else if (value instanceof Node) {
			container.appendChild(value);
		} else if (value !== null && value !== undefined) {
			container.appendChild(document.createTextNode(String(value)));
		}

		const nodes = Array.from(container.childNodes);
		parent.insertBefore(container, endMarker);
		return { container, nodes };
	}

	private updateArrayItem(item: IKeyedArrayItem, value: unknown, parent: Node, endMarker: Comment): void {
		if (value instanceof TemplateResult) {
			value.renderInto(item.container);
			item.value = value;
			item.nodes = Array.from(item.container.childNodes);
			return;
		}

		if (value === item.value) {
			return;
		}

		// The item's content type changed (was a template, now a plain value) —
		// dispose the old part tree before discarding it.
		disposeContainerParts(item.container);

		for (const node of item.nodes) {
			node.parentNode?.removeChild(node);
		}

		item.container = document.createDocumentFragment();
		if (value instanceof Node) {
			item.container.appendChild(value);
		} else if (value !== null && value !== undefined) {
			item.container.appendChild(document.createTextNode(String(value)));
		}

		item.nodes = Array.from(item.container.childNodes);
		parent.insertBefore(item.container, endMarker);
		item.value = value;
	}

	/**
	 * Commits an event binding through a stable wrapper listener.
	 *
	 * The wrapper is created once per part and registered with a single
	 * addEventListener call; subsequent renders only swap the stored handler,
	 * so re-renders cause zero add/removeEventListener churn and the listener
	 * keeps its original position in the target's listener list.
	 *
	 * Accepted values: a plain function (invoked with `this` = the event's
	 * currentTarget, matching direct addEventListener semantics) or an object
	 * with `handleEvent` plus optional listener options (capture/once/passive —
	 * see IEventHandlerWithOptions). When the options change, the wrapper is
	 * re-attached with the new options. Removal on part disposal is handled by
	 * disposePart (dispose.functions.ts).
	 */
	private commitEventPart(part: ITemplatePart, value: unknown): void {
		const element = part.node as Element;
		const name = part.name as string;

		const isFunctionHandler = typeof value === 'function';
		const isHandleEventObject =
			!isFunctionHandler &&
			value !== null &&
			typeof value === 'object' &&
			typeof (value as EventListenerObject).handleEvent === 'function';
		const active = isFunctionHandler || isHandleEventObject;
		const newOptions = isHandleEventObject ? extractListenerOptions(value as IEventHandlerWithOptions) : undefined;

		// One stable wrapper per event part, created lazily on the first
		// non-empty handler and kept for the part's lifetime.
		if (!part.eventWrapper) {
			part.eventWrapper = function (this: Element, event: Event): void {
				const handler = part.eventHandler;
				if (typeof handler === 'function') {
					// Preserve direct-listener semantics: `this` is the currentTarget.
					(handler as EventListener).call(this, event);
				} else if (handler !== null && typeof handler === 'object') {
					// EventListenerObject semantics: `this` is the handler object.
					(handler as EventListenerObject).handleEvent(event);
				}
			};
		}

		const optionsChanged = !sameListenerOptions(part.eventOptions, newOptions);

		if (part.eventAttached && (!active || optionsChanged)) {
			element.removeEventListener(name, part.eventWrapper, part.eventOptions);
			part.eventAttached = false;
		}

		part.eventHandler = active ? value : undefined;
		part.eventOptions = newOptions;

		// `once` listeners are re-armed when the handler changes: if the previous
		// registration already fired (and was auto-removed) this re-attaches; if
		// it hasn't fired yet, registering the identical wrapper + options is a
		// spec-guaranteed no-op, so `once` semantics are preserved either way.
		if (active && (!part.eventAttached || newOptions?.once)) {
			element.addEventListener(name, part.eventWrapper, newOptions);
			part.eventAttached = true;
		}
	}

	private commit(parts: ITemplatePart[]): void {
		for (const part of parts) {
			const value = this.values[part.index];
			const isCompositeAttribute = part.type === 'attribute' && part.attributeIndices && part.attributeStrings;

			// Skip unchanged values (but not for directives or action parts - they manage their own state)
			// Action parts with index < 0 are static and have their own skip logic
			if (!isCompositeAttribute && !isDirective(value) && part.type !== 'action' && part.previousValue === value) {
				continue;
			}

			switch (part.type) {
				case 'node':
					if (part.node) {
						const wasDirective = isDirective(part.previousValue);
						const nowDirective = isDirective(value);

						// Transition from directive → non-directive: clean up directive DOM
						if (wasDirective && !nowDirective && part.directiveState) {
							this.clearDirectiveDOM(part);
						}

						// Transition from non-directive → directive: clean up rendered nodes
						if (!wasDirective && nowDirective) {
							this.clearRenderedNodes(part);
						}

						// Handle directives
						if (nowDirective) {
							// Transition between two DIFFERENT directive types: never hand
							// one directive's state to another. Dispose the old directive's
							// state and DOM, then let the new directive start fresh.
							if (part.directiveState !== undefined && part.directiveType !== value.type) {
								this.clearDirectiveDOM(part);
							}
							part.directiveState = value.render(part.node, part.directiveState);
							part.directiveType = value.type;
						} else if (value instanceof TemplateResult) {
							// Handle nested TemplateResult
							this.renderNestedTemplate(part, value);
						} else if (value instanceof Node) {
							// Handle DOM Node
							this.renderNode(part, value);
						} else if (Array.isArray(value)) {
							// Handle arrays of values
							this.renderArray(part, value);
						} else {
							// Clear any previously rendered complex content
							this.clearRenderedNodes(part);
							part.node.textContent = String(value ?? '');
						}
					}
					break;

				case 'attribute':
					if (part.node && part.name) {
						const element = part.node as Element;
						// Handle directives
						if (isDirective(value)) {
							if (part.directiveState !== undefined && part.directiveType !== value.type) {
								// Directive type switched — dispose the old state instead of
								// passing it to a different directive.
								disposeDirectiveState(part.directiveState);
								part.directiveState = undefined;
							}
							part.directiveState = value.render(element, part.directiveState);
							part.directiveType = value.type;
						} else if (isCompositeAttribute) {
							const strings = part.attributeStrings as string[];
							const indices = part.attributeIndices as number[];
							let composed = strings[0] ?? '';

							for (let i = 0; i < indices.length; i++) {
								const segmentValue = this.values[indices[i]];
								composed += `${segmentValue ?? ''}${strings[i + 1] ?? ''}`;
							}

							if (part.previousValue === composed) {
								// Composed value unchanged — skip the DOM write. Use continue
								// (not break) so the loop's trailing `part.previousValue = value`
								// can't overwrite the stored composed string with a single
								// segment value, which would defeat this skip forever.
								continue;
							}

							if (composed === '' && strings.every((segment) => segment === '')) {
								element.removeAttribute(part.name);
							} else {
								element.setAttribute(part.name, composed);
							}

							part.previousValue = composed;
							continue;
						} else if (typeof value === 'boolean' && part.name.startsWith('aria-')) {
							// ARIA state attributes use the literal strings "true"/"false",
							// never HTML boolean-attribute (present/absent) semantics.
							element.setAttribute(part.name, String(value));
						} else if (value === null || value === undefined || value === false) {
							// Remove attribute for null, undefined, or false (boolean attributes)
							element.removeAttribute(part.name);
						} else if (value === true) {
							// Boolean true sets empty attribute (e.g., disabled="")
							element.setAttribute(part.name, '');
						} else {
							element.setAttribute(part.name, String(value));
						}
					}
					break;

				case 'boolean-attribute':
					if (part.node && part.name) {
						const element = part.node as Element;
						if (value) {
							element.setAttribute(part.name, '');
						} else {
							element.removeAttribute(part.name);
						}
					}
					break;

				case 'property':
					if (part.node && part.name) {
						// Handle directives
						if (isDirective(value)) {
							if (part.directiveState !== undefined && part.directiveType !== value.type) {
								disposeDirectiveState(part.directiveState);
								part.directiveState = undefined;
							}
							part.directiveState = value.render(part.node as Element, part.directiveState);
							part.directiveType = value.type;
						} else {
							if (part.name === 'innerHTML' || part.name === 'outerHTML') {
								warnUnsafePropertyBinding(part.name);
							}
							(part.node as Element & Record<string, unknown>)[part.name] = value;
						}
					}
					break;

				case 'event':
					if (part.node && part.name) {
						this.commitEventPart(part, value);
					}
					break;

				case 'action':
					if (part.node && part.name) {
						const element = part.node as Element;

						// Get directive value: dynamic (from values array) or static (from attribute)
						const directiveValue = part.index >= 0 ? value : part.staticValue;

						// Skip if value hasn't changed (for dynamic values)
						if (part.index >= 0 && part.previousValue === directiveValue) {
							continue;
						}

						// For static directives, only run once (when actionCleanup is undefined)
						if (part.index < 0 && part.actionCleanup !== undefined) {
							continue;
						}

						// Call previous cleanup if exists
						if (part.actionCleanup) {
							part.actionCleanup();
							part.actionCleanup = undefined;
						}

						// Look up directive from registry
						const directive = getAttributeDirective(part.name);
						if (directive) {
							const cleanup = directive(element, directiveValue, part.name);
							if (typeof cleanup === 'function') {
								part.actionCleanup = cleanup;
							} else {
								// Mark as initialized even without cleanup
								part.actionCleanup = () => {};
							}
						} else {
							console.warn(`Attribute directive ':${part.name}' not found in registry`);
						}
					}
					break;
				default:
					break;
			}

			part.previousValue = value;
		}
	}
}
