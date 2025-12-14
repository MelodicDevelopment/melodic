export { directive, Directive, isDirective } from './directive';
export type { DirectiveResult } from './directive';
export { html, css, render, TemplateResult } from './template';
export {
	registerAttributeDirective,
	getAttributeDirective,
	hasAttributeDirective,
	unregisterAttributeDirective,
	getRegisteredDirectives
} from './attribute-directive';
export type { AttributeDirectiveFunction } from './attribute-directive';

export * from './directives';
