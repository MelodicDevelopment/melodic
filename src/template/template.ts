/**
 * Ultra-fast template system with minimal overhead
 */

import { isDirective } from './directive';

// Unique marker for identifying dynamic positions
const MARKER = `m${Math.random().toString(36).slice(2, 9)}`;
const COMMENT_NODE_MARKER = `<!--${MARKER}-->`;

interface Part {
	type: 'node' | 'attribute' | 'property' | 'event';
	index: number;
	name?: string;
	node?: Node;
	previousValue?: unknown;
	directiveState?: any; // State for directives (like repeat())
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

	private commit(parts: Part[]): void {
		for (const part of parts) {
			const value = this.values[part.index];

			// Skip unchanged values (but not for directives - they manage their own state)
			if (!isDirective(value) && part.previousValue === value) {
				continue;
			}

			switch (part.type) {
				case 'node':
					if (part.node) {
						// Handle directives
						if (isDirective(value)) {
							part.directiveState = value.render(part.node, part.directiveState);
						} else {
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
						} else if (value == null) {
							element.removeAttribute(part.name);
						} else {
							element.setAttribute(part.name, String(value));
						}
					}
					break;

				case 'property':
					if (part.node && part.name) {
						const element = part.node as Element;
						// Handle directives
						if (isDirective(value)) {
							part.directiveState = value.render(element, part.directiveState);
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
			}

			part.previousValue = value;
		}
	}
}

export function render(result: TemplateResult, container: Element | DocumentFragment): void {
	result.renderInto(container);
}
