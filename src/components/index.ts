export { ComponentBase } from './classes/component-base.class';
export { MelodicComponent } from './decorators/melodic-component.decorator';
export { applyGlobalStyles, refreshGlobalStyles } from './styles/apply-global-styles.function';
export { getActiveComponent, setActiveComponent } from './functions/active-component.functions';
export { emit } from './functions/emit.function';
export type { IEmitOptions } from './functions/emit.function';

export type * from './interfaces';
export type * from './types';
export { getComponentDefinition, getComponentDefinitions } from './functions/component-registry.functions';
export type { IRegisteredComponent } from './functions/component-registry.functions';
export { attributeNames, attributeTypes } from './types/component-meta.type';
export type { AttributeType, ComponentAttributes } from './types/component-meta.type';
