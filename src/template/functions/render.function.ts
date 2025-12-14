import type { TemplateResult } from '../classes/template-result.class';

export function render(result: TemplateResult, container: Element | DocumentFragment): void {
	result.renderInto(container);
}
