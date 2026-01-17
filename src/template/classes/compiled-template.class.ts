/**
 * Compiled Template - Fast DOM creation using createElement instead of cloneNode
 *
 * For simple single-element templates (like repeat items), generates an optimized
 * factory function that creates DOM directly without any parsing overhead.
 */

// Cache compiled factories by template strings identity
const compiledCache = new WeakMap<TemplateStringsArray, CompiledTemplate>();

type FastFactory = (values: unknown[]) => Node;

interface CompiledResult {
	nodes: Node[];
	eventTargets: Array<{ element: Element; event: string; valueIndex: number }>;
}

export class CompiledTemplate {
	private factory: FastFactory | null = null;
	private hasEvents: boolean = false;
	private canCompile: boolean = false;

	private constructor(strings: TemplateStringsArray) {
		this.analyzeAndCompile(strings);
	}

	static compile(strings: TemplateStringsArray): CompiledTemplate {
		let compiled = compiledCache.get(strings);
		if (!compiled) {
			compiled = new CompiledTemplate(strings);
			compiledCache.set(strings, compiled);
		}
		return compiled;
	}

	/**
	 * Check if this template can use the fast path
	 */
	canUseFastPath(): boolean {
		return this.canCompile && !this.hasEvents;
	}

	/**
	 * Create DOM nodes using the compiled factory
	 */
	create(values: unknown[]): CompiledResult {
		if (this.factory) {
			return { nodes: [this.factory(values)], eventTargets: [] };
		}
		return { nodes: [], eventTargets: [] };
	}

	/**
	 * Directly create a single node - faster than create() for single-element templates
	 */
	createDirect(values: unknown[]): Node | null {
		return this.factory ? this.factory(values) : null;
	}

	/**
	 * Analyze template and generate optimized factory for simple cases
	 *
	 * Template strings format for: html`<li class="${val}">${text}</li>`
	 * strings = ['<li class="', '">', '</li>']
	 * values[0] goes between strings[0] and strings[1]
	 * values[1] goes between strings[1] and strings[2]
	 */
	private analyzeAndCompile(strings: TemplateStringsArray): void {
		if (strings.length < 2) return;

		// Check for events
		for (const s of strings) {
			if (s.includes('@')) {
				this.hasEvents = true;
				return;
			}
		}

		// Join strings with placeholders to analyze structure
		let html = strings[0];
		for (let i = 1; i < strings.length; i++) {
			html += `\${${i - 1}}` + strings[i];
		}

		// Must be a simple single element: <tag ...>...</tag>
		const fullMatch = html.match(/^<([\w-]+)([^>]*)>(.*)$/s);
		if (!fullMatch) return;

		const [, tag, attrString, rest] = fullMatch;

		// Must end with closing tag
		const closingTag = `</${tag}>`;
		if (!rest.endsWith(closingTag)) return;

		const textContent = rest.slice(0, -closingTag.length);

		// Parse attributes - both static and dynamic
		const attrs: Array<{ name: string; valueIndex: number | null; staticValue?: string }> = [];

		// Match all attributes including dynamic ones
		const attrRegex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\$\{(\d+)\})/g;
		let attrMatch;
		while ((attrMatch = attrRegex.exec(attrString)) !== null) {
			const name = attrMatch[1];
			const staticVal = attrMatch[2] ?? attrMatch[3];
			const dynamicIndex = attrMatch[4];

			if (dynamicIndex !== undefined) {
				attrs.push({ name, valueIndex: parseInt(dynamicIndex, 10) });
			} else if (staticVal !== undefined) {
				// Check if static value contains a placeholder
				const placeholderMatch = staticVal.match(/\$\{(\d+)\}/);
				if (placeholderMatch) {
					attrs.push({ name, valueIndex: parseInt(placeholderMatch[1], 10) });
				} else {
					attrs.push({ name, valueIndex: null, staticValue: staticVal });
				}
			}
		}

		// Parse text content for placeholders
		const textParts: Array<{ static: string } | { valueIndex: number }> = [];
		const remaining = textContent;
		const placeholderRegex = /\$\{(\d+)\}/g;
		let lastIndex = 0;
		let textMatch;

		placeholderRegex.lastIndex = 0;
		while ((textMatch = placeholderRegex.exec(remaining)) !== null) {
			if (textMatch.index > lastIndex) {
				textParts.push({ static: remaining.slice(lastIndex, textMatch.index) });
			}
			textParts.push({ valueIndex: parseInt(textMatch[1], 10) });
			lastIndex = textMatch.index + textMatch[0].length;
		}
		if (lastIndex < remaining.length) {
			textParts.push({ static: remaining.slice(lastIndex) });
		}

		// Generate factory function
		this.factory = (values: unknown[]): Node => {
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

		this.canCompile = true;
	}
}
