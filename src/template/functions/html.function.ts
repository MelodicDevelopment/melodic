import { TemplateResult } from '../classes/template-result.class';
import { CssResult } from '../classes/css-result.class';

export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return new TemplateResult(strings, values);
}

/**
 * Tag for component styles. Returns a `TemplateResult` (so it is accepted
 * everywhere it always was) whose text the style pipeline reads directly
 * instead of round-tripping the CSS through the HTML parser.
 */
export function css(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return new CssResult(strings, values);
}
