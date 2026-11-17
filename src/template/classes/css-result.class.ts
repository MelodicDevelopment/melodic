import { TemplateResult } from './template-result.class';
import { isDirective } from '../directives/functions/is-directive.function';

/**
 * The result of a `css` tagged template.
 *
 * `css` used to be an alias of `html`, so a component's stylesheet was parsed
 * as HTML and read back through `textContent`: entities were decoded and
 * anything that looked like a tag was dropped (`content: "&lt;b&gt;"` became
 * `content: "<b>"`, `content: "<i>x</i>"` became `content: "x"`). CSS is text,
 * so the component style pipeline now reads `cssText` instead.
 *
 * It still extends `TemplateResult`, so everything that accepted the old
 * return value — `styles: () => css\`…\``, `render(css\`…\`, element)`, nesting
 * one result in another — keeps working unchanged.
 *
 * Internal: not exported from the package entry points.
 */
export class CssResult extends TemplateResult {
	/**
	 * The stylesheet as plain text, or `null` when a value cannot be
	 * represented as text (a directive or a DOM node) and the caller must fall
	 * back to rendering the result as a template.
	 */
	public get cssText(): string | null {
		const strings = this.strings;
		let text = strings[0] ?? strings.raw[0];

		for (let i = 0; i < this.values.length; i++) {
			const piece = cssValueToText(this.values[i]);
			if (piece === null) {
				return null;
			}
			// An invalid escape leaves the cooked string undefined; the raw
			// text is what the author wrote.
			text += piece + (strings[i + 1] ?? strings.raw[i + 1]);
		}

		return text;
	}
}

/** Text for one interpolated value, mirroring how a text binding renders it. */
function cssValueToText(value: unknown): string | null {
	if (value === null || value === undefined) {
		return '';
	}

	if (value instanceof CssResult) {
		return value.cssText;
	}

	if (Array.isArray(value)) {
		let joined = '';
		for (const item of value) {
			const piece = cssValueToText(item);
			if (piece === null) {
				return null;
			}
			joined += piece;
		}
		return joined;
	}

	// A plain `html` result, a directive or a node needs the template renderer.
	if (value instanceof TemplateResult || isDirective(value) || (typeof Node !== 'undefined' && value instanceof Node)) {
		return null;
	}

	return String(value);
}
