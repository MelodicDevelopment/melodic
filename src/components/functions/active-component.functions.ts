import type { ComponentBase } from '../classes/component-base.class';

let activeComponent: ComponentBase | null = null;

export const setActiveComponent = (component: ComponentBase | null): void => {
	activeComponent = component;
};

export const getActiveComponent = (): ComponentBase | null => activeComponent;
