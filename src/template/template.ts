/**
 * Ultra-fast template system with minimal overhead
 */

import { isDirective } from './directive';
import { getAttributeDirective } from './attribute-directive';

// Unique marker for identifying dynamic positions
const MARKER = `m${Math.random().toString(36).slice(2, 9)}`;
const COMMENT_NODE_MARKER = `<!--${MARKER}-->`;

interface Part {
	type: 'node' | 'attribute' | 'property' | 'event' | 'action';
	index: number;
	name?: string;
	node?: Node;
	previousValue?: unknown;
	directiveState?: any; // State for directives (like repeat())
	// For node parts that render nested templates/nodes, track the rendered nodes
	renderedNodes?: Node[];
	startMarker?: Comment;
	endMarker?: Comment;
	// For action directives, store cleanup function and static value
	actionCleanup?: () => void;
	staticValue?: string; // For static :directive="value" attributes
}

interface TemplateCache {
	element: HTMLTemplateElement;
	parts: Part[];
}

const templateCache = new Map<string, TemplateCache>();

/**
 * Tagged template function - main API
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return new TemplateResult(strings, values);
}

export const css = html;

export class TemplateResult {
	strings: TemplateStringsArray;
	values: unknown[];

	constructor(strings: TemplateStringsArray, values: unknown[]) {
		this.strings = strings;
		this.values = values;
	}

	renderInto(container: Element | DocumentFragment): void {
		// Get or create template
		const { element: template, parts: templateParts } = this.getTemplate();

		// First render - clone and prepare
		if (!(container as any).__parts) {
			const clone = template.content.cloneNode(true);
			const parts = this.prepareParts(clone, templateParts);
			(container as any).__parts = parts;

			// Commit values BEFORE appending to DOM so attributes are set
			// before connectedCallback fires on child custom elements
			this.commit(parts);

			container.textContent = '';
			container.appendChild(clone);
			return;
		}

		// Update values
		const parts = (container as any).__parts as Part[];
		this.commit(parts);
	}

	private getTemplate(): TemplateCache {
		const key = this.strings.join(MARKER);
		let cached = templateCache.get(key);

		if (cached) {
			return cached;
		}

		// Build HTML with markers
		const parts: Part[] = [];
		let html = this.strings[0];

		for (let i = 1; i < this.strings.length; i++) {
			const s = this.strings[i];

			// Check if we're in an attribute position (include @, ., :, etc.)
			const match = /([@.:]?[\w-]+)\s*=\s*["']?$/.exec(html);

			if (match) {
				const attrName = match[1];

				if (attrName.startsWith('@')) {
					// Event binding
					parts.push({
						type: 'event',
						index: i - 1,
						name: attrName.slice(1)
					});
					html = html.slice(0, -match[0].length) + `__event-${i - 1}__=""`;
				} else if (attrName.startsWith('.')) {
					// Property binding
					parts.push({
						type: 'property',
						index: i - 1,
						name: attrName.slice(1)
					});
					html = html.slice(0, -match[0].length) + `__prop-${i - 1}__=""`;
				} else if (attrName.startsWith(':')) {
					// Action directive binding
					parts.push({
						type: 'action',
						index: i - 1,
						name: attrName.slice(1)
					});
					html = html.slice(0, -match[0].length) + `__action-${i - 1}__=""`;
				} else {
					// Regular attribute
					parts.push({
						type: 'attribute',
						index: i - 1,
						name: attrName
					});
					html += MARKER;
				}
			} else {
				// Text position
				parts.push({
					type: 'node',
					index: i - 1
				});
				html += COMMENT_NODE_MARKER;
			}

			html += s;
		}

		const element = document.createElement('template');
		element.innerHTML = html;

		cached = { element, parts };
		templateCache.set(key, cached);

		return cached;
	}

	private prepareParts(clone: Node, templateParts: Part[]): Part[] {
		const parts: Part[] = [];

		// Recursive walk to find all nodes
		const walk = (node: Node) => {
			if (node.nodeType === Node.COMMENT_NODE) {
				const comment = node as Comment;
				if (comment.data === MARKER) {
					// Find corresponding part
					const part = templateParts.find((p) => p.type === 'node' && !parts.find((pp) => pp.index === p.index));
					if (part) {
						// Create a text node to replace the comment
						const textNode = document.createTextNode('');
						comment.parentNode!.replaceChild(textNode, comment);

						parts.push({
							...part,
							node: textNode
						});
					}
				}
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				const element = node as Element;

				// Check for event/property markers
				for (let i = element.attributes.length - 1; i >= 0; i--) {
					const attr = element.attributes[i];

					if (attr.name.startsWith('__event-')) {
						const index = parseInt(attr.name.match(/__event-(\d+)__/)?.[1] || '0');
						const part = templateParts.find((p) => p.index === index && p.type === 'event');
						if (part) {
							parts.push({
								...part,
								node: element
							});
						}
						element.removeAttribute(attr.name);
					} else if (attr.name.startsWith('__prop-')) {
						const index = parseInt(attr.name.match(/__prop-(\d+)__/)?.[1] || '0');
						const part = templateParts.find((p) => p.index === index && p.type === 'property');
						if (part) {
							parts.push({
								...part,
								node: element
							});
						}
						element.removeAttribute(attr.name);
					} else if (attr.name.startsWith('__action-')) {
						const index = parseInt(attr.name.match(/__action-(\d+)__/)?.[1] || '0');
						const part = templateParts.find((p) => p.index === index && p.type === 'action');
						if (part) {
							parts.push({
								...part,
								node: element
							});
						}
						element.removeAttribute(attr.name);
					} else if (attr.name.startsWith(':')) {
						// Static action directive (e.g., :routerLink="/home")
						// Browser lowercases attribute names, so directive lookup is case-insensitive
						const directiveName = attr.name.slice(1);
						parts.push({
							type: 'action',
							index: -1, // No dynamic index for static directives
							name: directiveName,
							node: element,
							staticValue: attr.value
						});
						element.removeAttribute(attr.name);
					} else if (attr.value.includes(MARKER)) {
						// Regular attribute with marker
						const part = templateParts.find((p) => p.type === 'attribute' && p.name === attr.name && !parts.find((pp) => pp.index === p.index));
						if (part) {
							parts.push({
								...part,
								node: element
							});
							// Remove the marker attribute so directives can work with a clean element
							element.removeAttribute(attr.name);
						}
					}
				}
			}

			// Walk children
			const children = Array.from(node.childNodes);
			for (const child of children) {
				walk(child);
			}
		};

		walk(clone);

		return parts;
	}

	/**
	 * Sets up markers for a node part to enable complex content rendering
	 */
	private ensureMarkers(part: Part): void {
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
	private clearRenderedNodes(part: Part): void {
		if (!part.renderedNodes || part.renderedNodes.length === 0) return;

		for (const node of part.renderedNodes) {
			node.parentNode?.removeChild(node);
		}
		part.renderedNodes = [];
	}

	/**
	 * Renders a nested TemplateResult into a node part
	 */
	private renderNestedTemplate(part: Part, template: TemplateResult): void {
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
	private renderNode(part: Part, node: Node): void {
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
	private renderArray(part: Part, values: unknown[]): void {
		this.ensureMarkers(part);
		this.clearRenderedNodes(part);

		// Hide the original text node
		part.node!.textContent = '';

		const parent = part.endMarker!.parentNode!;
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
			} else if (value != null) {
				const textNode = document.createTextNode(String(value));
				renderedNodes.push(textNode);
				parent.insertBefore(textNode, part.endMarker!);
			}
		}

		part.renderedNodes = renderedNodes;
	}

	private commit(parts: Part[]): void {
		for (const part of parts) {
			const value = this.values[part.index];

			// Skip unchanged values (but not for directives or action parts - they manage their own state)
			// Action parts with index < 0 are static and have their own skip logic
			if (!isDirective(value) && part.type !== 'action' && part.previousValue === value) {
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
						} else if (value == null || value === false) {
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
			}

			part.previousValue = value;
		}
	}
}

export function render(result: TemplateResult, container: Element | DocumentFragment): void {
	result.renderInto(container);
}
