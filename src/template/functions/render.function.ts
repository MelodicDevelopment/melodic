import type { TemplateResult } from '../template-result.class';

export function render(result: TemplateResult, container: Element | DocumentFragment): void {
	result.renderInto(container);
}
