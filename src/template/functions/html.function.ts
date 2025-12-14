import { TemplateResult } from '../template-result.class';

export function html(strings: TemplateStringsArray, ...values: unknown[]): TemplateResult {
	return new TemplateResult(strings, values);
}

export const css = html;
