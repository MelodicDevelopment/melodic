import type { INewable } from '../interfaces/inewable.interface';
import { ComponentBase } from './component-base.class';
import type { TypedComponentMeta } from './types/component-meta.type';

export function MelodicComponent<C>(meta: TypedComponentMeta<C>): <T extends INewable>(component: T) => void {
	return function <T extends INewable>(component: T): void {
		if (customElements.get(meta.selector) === undefined) {
			const webComponent = class extends ComponentBase {
				constructor() {
					super(meta, Reflect.construct(component, component.params ?? []));
				}

				static observedAttributes: string[] = meta.attributes ?? [];
			};

			customElements.define(meta.selector, webComponent);
		}
	};
}
