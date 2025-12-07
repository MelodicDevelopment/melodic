import type { INewable } from '../interfaces/inewable.interface';
import { ComponentBase } from './component-base.class';
import type { TypedComponentMeta } from './types/component-meta.type';
import type { Component } from './types/component.type';
import { Injector } from '../injection';

export function MelodicComponent<C extends Component>(meta: TypedComponentMeta<C>): (component: INewable<C>) => void {
	return function (component: INewable<C>): void {
		if (customElements.get(meta.selector) === undefined) {
			const webComponent = class extends ComponentBase {
				constructor() {
					const dependencies: unknown[] = [];
					const paramTokens = (component as any).params;

					if (paramTokens && Array.isArray(paramTokens)) {
						for (let i = 0; i < paramTokens.length; i++) {
							const param = paramTokens[i];
							if (param && typeof param === 'object' && param.__injectionToken) {
								dependencies.push(Injector.get(param.__injectionToken));
							} else {
								dependencies.push(undefined);
							}
						}
					}

					super(meta, Reflect.construct(component, dependencies));
				}

				static observedAttributes: string[] = meta.attributes ?? [];
			};

			customElements.define(meta.selector, webComponent);
		}
	};
}
