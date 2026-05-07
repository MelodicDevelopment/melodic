import type { INewable } from '../../interfaces/inewable.interface';
import { ComponentBase } from '../classes/component-base.class';
import type { TypedComponentMeta } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { Injector } from '../../injection/classes/injection-engine.class';
import { getActiveComponent, setActiveComponent } from '../functions/active-component.functions';
import type { Signal } from '../../signals/types/signal.type';

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

					// Establish a scope for class-field initializers (e.g. `x = this._store.select(...)`)
					// before Reflect.construct runs the user's constructor. The placeholder exposes
					// only the surface select() reads from getActiveComponent(); ComponentBase adopts
					// these same Set/Map references via the third super() argument.
					const disposables = new Set<{ destroy(): void }>();
					const selectCache = new Map<string, Signal<unknown>>();
					const placeholder = {
						getSelectCache: () => selectCache,
						registerDisposable: (d: { destroy(): void }) => {
							disposables.add(d);
						}
					};
					const prevActive = getActiveComponent();
					setActiveComponent(placeholder as unknown as ComponentBase);
					let userInstance: C;
					try {
						userInstance = Reflect.construct(component, dependencies) as C;
					} finally {
						setActiveComponent(prevActive);
					}

					super(meta, userInstance, { disposables, selectCache });
				}

				public static readonly observedAttributes: string[] = meta.attributes ?? [];
			};

			const componentWithSelector: INewable<C> & { selector?: string } = component as INewable<C> & { selector?: string };
			componentWithSelector.selector = meta.selector;

			customElements.define(meta.selector, webComponent);
		}
	};
}
