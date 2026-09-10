import type { ComponentMeta } from '../types/component-meta.type';

export interface IRegisteredComponent {
	selector: string;
	/** The user's component class (not the generated custom element class). */
	componentClass: unknown;
	meta: ComponentMeta;
}

const registry = new Map<string, IRegisteredComponent>();

/** Record a component registration. Called by `@MelodicComponent`. */
export function registerComponentDefinition(entry: IRegisteredComponent): void {
	registry.set(entry.selector, entry);
}

/** The component registered under `selector`, if any. */
export function getComponentDefinition(selector: string): IRegisteredComponent | undefined {
	return registry.get(selector);
}

/**
 * Every component this build registered, in registration order. Powers
 * DevTools and `melodic.components()`; also useful in tests.
 */
export function getComponentDefinitions(): IRegisteredComponent[] {
	return [...registry.values()];
}
