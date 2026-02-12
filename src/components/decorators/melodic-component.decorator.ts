import type { INewable } from '../../interfaces/inewable.interface';
import { ComponentBase } from '../classes/component-base.class';
import type { TypedComponentMeta } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { Injector } from '../../injection/classes/injection-engine.class';

export function MelodicComponent<C extends Component>(meta: TypedComponentMeta<C>): (component: INewable<C>) => void {
	return function (component: INewable<C>): void {
		if (customElements.get(meta.selector) === undefined) {
			const webComponent = class extends ComponentBase {
				constructor() {
					const dependencies: unknown[] = [];
					const paramTokens = (component as any).params;

					if (paramTokens && Array.isArray(paramTokens)) {
						for (const i of paramTokens) {
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

				static readonly observedAttributes: string[] = meta.attributes ?? [];
			};

			const componentWithSelector: INewable<C> & { selector?: string } = component as INewable<C> & { selector?: string };
			componentWithSelector.selector = meta.selector;

			customElements.define(meta.selector, webComponent);
		}
	};
}
