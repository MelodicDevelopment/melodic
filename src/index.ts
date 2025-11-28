// Component system
export { MelodicComponent } from './components/melodic-component.decorator';
export type { IComponent } from './components/interfaces/icomponent.interface';
export type { IComponentMeta } from './components/interfaces/icomponent-meta.interface';

// Template system
export { html, render } from './template/template';
export type { TemplateResult } from './template/template';

// Directive system
export { Directive, directive, isDirective } from './template/directive';
export type { DirectiveResult } from './template/directive';

// Built-in directives
export { repeat } from './template/directives/repeat';
export { when } from './template/directives/when';
export { classMap } from './template/directives/classMap';
export { styleMap } from './template/directives/styleMap';
export { unsafeHTML } from './template/directives/unsafeHTML';
