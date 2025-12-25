// Built-in directives
export { repeat } from './builtin/repeat.directive';
export { when } from './builtin/when.directive';
export { classMap } from './builtin/class-map.directive';
export { styleMap } from './builtin/style-map.directive';
export { unsafeHTML } from './builtin/unsafe-html.directive';
export { portalDirective } from './builtin/portal.directive';
export type { PortalOptions, PortalValue } from './builtin/portal.directive';

// Directive utilities
export { directive } from './functions/directive.function';
export { isDirective } from './functions/is-directive.function';
export {
	registerAttributeDirective,
	getAttributeDirective,
	hasAttributeDirective,
	unregisterAttributeDirective,
	getRegisteredDirectives
} from './functions/attribute-directive.functions';

// Directive class
export { Directive } from './directive.class';

// Interfaces
export type { IDirectiveResult } from './interfaces/idirective-result.interface';

// Types
export type { AttributeDirectiveFunction } from './types/attribute-directive-function.type';
export type { AttributeDirectiveCleanupFunction } from './types/attribute-directive-cleanup-function.type';
