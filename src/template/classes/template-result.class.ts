import { getAttributeDirective } from '../directives/functions/attribute-directive.functions';
import type { ITemplatePart } from '../interfaces/itemplate-part.interface';
import type { ITemplateCache, IPartPath } from '../interfaces/itemplate-cache.interface';
import { isDirective } from '../directives/functions/is-directive.function';

// Unique marker for identifying dynamic positions
const MARKER = `m${Math.random().toString(36).slice(2, 9)}`;
const COMMENT_NODE_MARKER = `<!--${MARKER}-->`;
const ATTRIBUTE_MARKER_PREFIX = `__${MARKER}_`;
const ATTRIBUTE_MARKER_REGEX = new RegExp(`${ATTRIBUTE_MARKER_PREFIX}(\\d+)__`, 'g');

const createAttributeMarker = (index: number): string => `${ATTRIBUTE_MARKER_PREFIX}${index}__`;

const templateCache = new Map<string, ITemplateCache>();

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
	strings: TemplateStringsArray;
	values: unknown[];

	constructor(strings: TemplateStringsArray, values: unknown[]) {
		this.strings = strings;
		this.values = values;
	}

	/**
	 * Optimized render for single-use containers (like repeat items).
	 * Skips container caching overhead for better performance.
	 * Returns the rendered nodes directly.
	 */
	renderOnce(container: DocumentFragment): Node[] {
		const cache = this.getTemplate(getTemplateKey(this.strings));
		const clone = cache.element.content.cloneNode(true);
		const parts = this.prepareParts(clone, cache);

		this.commit(parts);
		container.appendChild(clone);

		return Array.from(container.childNodes);
	}

	renderInto(container: Element | DocumentFragment): void {
		const templateKey = getTemplateKey(this.strings);

		// Get or create template
		const { element: template } = this.getTemplate(templateKey);

		// First render - clone and prepare
		const existingKey = (container as any).__templateKey as string | undefined;
		if (existingKey && existingKey !== templateKey) {
			const existingParts = (container as any).__parts as ITemplatePart[] | undefined;
			if (existingParts) {
				this.cleanupParts(existingParts);
			}
			delete (container as any).__parts;
		}

		if (!(container as any).__parts) {
			const clone = template.content.cloneNode(true);
			const parts = this.prepareParts(clone, this.getTemplate(templateKey));

			(container as any).__parts = parts;
			(container as any).__templateKey = templateKey;

			// Commit values BEFORE appending to DOM so attributes are set
			// before connectedCallback fires on child custom elements
			this.commit(parts);

			container.textContent = '';
			container.appendChild(clone);
			return;
		}

		// Update values
		if (!(container as any).__templateKey) {
			(container as any).__templateKey = templateKey;
		}
		const parts = (container as any).__parts as ITemplatePart[];
		this.commit(parts);
	}

	private getTemplate(key: string): ITemplateCache {
		let cached = templateCache.get(key);

		if (cached) {
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

			const match = /([@.:]?[\w:-]+)\s*=\s*["']?$/.exec(html);
			const quotedAttrMatch = /([@.:]?[\w:-]+)\s*=\s*(["'])([^"']*)$/.exec(html);
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
	 * Clears previously rendered nodes between markers
	 */
	private clearRenderedNodes(part: ITemplatePart): void {
		if (!part.renderedNodes || part.renderedNodes.length === 0) return;

		for (const node of part.renderedNodes) {
			node.parentNode?.removeChild(node);
		}
		part.renderedNodes = [];
		part.arrayState = undefined;
	}

	private cleanupParts(parts: ITemplatePart[]): void {
		for (const part of parts) {
			if (part.actionCleanup) {
				try {
					part.actionCleanup();
				} catch (error) {
					console.error('Action directive cleanup failed:', error);
				} finally {
					part.actionCleanup = undefined;
				}
			}

			if (part.renderedNodes && part.renderedNodes.length > 0) {
				this.clearRenderedNodes(part);
			}
		}
	}

	/**
	 * Renders a nested TemplateResult into a node part
	 */
	private renderNestedTemplate(part: ITemplatePart, template: TemplateResult): void {
		this.ensureMarkers(part);
		this.clearRenderedNodes(part);

		// Hide the original text node
		part.node!.textContent = '';

		const fragment = document.createDocumentFragment();
		template.renderInto(fragment);

		const nodes = Array.from(fragment.childNodes);
		part.renderedNodes = nodes;

		const parent = part.endMarker!.parentNode!;
		parent.insertBefore(fragment, part.endMarker!);
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
				items: new Map<unknown, { key: unknown; value: unknown; container: DocumentFragment; nodes: Node[] }>(),
				keys: []
			};

			const newItems = new Map<unknown, { key: unknown; value: unknown; container: DocumentFragment; nodes: Node[] }>();
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

		for (const value of values) {
			if (value instanceof TemplateResult) {
				const fragment = document.createDocumentFragment();
				value.renderInto(fragment);
				const nodes = Array.from(fragment.childNodes);
				renderedNodes.push(...nodes);
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

	private updateArrayItem(
		item: { key: unknown; value: unknown; container: DocumentFragment; nodes: Node[] },
		value: unknown,
		parent: Node,
		endMarker: Comment
	): void {
		if (value instanceof TemplateResult) {
			value.renderInto(item.container);
			item.value = value;
			item.nodes = Array.from(item.container.childNodes);
			return;
		}

		if (value === item.value) {
			return;
		}

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
						// Handle directives
						if (isDirective(value)) {
							part.directiveState = value.render(part.node, part.directiveState);
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
							part.directiveState = value.render(element, part.directiveState);
						} else if (isCompositeAttribute) {
							const strings = part.attributeStrings as string[];
							const indices = part.attributeIndices as number[];
							let composed = strings[0] ?? '';

							for (let i = 0; i < indices.length; i++) {
								const segmentValue = this.values[indices[i]];
								composed += `${segmentValue ?? ''}${strings[i + 1] ?? ''}`;
							}

							if (part.previousValue === composed) {
								break;
							}

							if (composed === '' && strings.every((segment) => segment === '')) {
								element.removeAttribute(part.name);
							} else {
								element.setAttribute(part.name, composed);
							}

							part.previousValue = composed;
							continue;
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

				case 'property':
					if (part.node && part.name) {
						// Handle directives
						if (isDirective(value)) {
							part.directiveState = value.render(part.node as Element, part.directiveState);
						} else {
							(part.node as any)[part.name] = value;
						}
					}
					break;

				case 'event':
					if (part.node && part.name) {
						const element = part.node as Element;

						if (part.previousValue === value) {
							break;
						}

						// Remove old listener
						if (part.previousValue && typeof part.previousValue === 'function') {
							element.removeEventListener(part.name, part.previousValue as EventListener);
						}

						// Add new listener
						if (typeof value === 'function') {
							element.addEventListener(part.name, value as EventListener);
						}
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
