import type { INewable } from '../../interfaces/inewable.interface';
import { ComponentBase } from '../classes/component-base.class';
import type { TypedComponentMeta } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { Injector } from '../../injection/classes/injection-engine.class';
import { resolveInjectedParams } from '../../injection/function/resolve-injected-params.function';
import { getActiveComponent, setActiveComponent } from '../functions/active-component.functions';
import type { Signal } from '../../signals/types/signal.type';

export function MelodicComponent<C extends Component>(meta: TypedComponentMeta<C>): (component: INewable<C>) => void {
	return function (component: INewable<C>): void {
		if (customElements.get(meta.selector) === undefined) {
			const webComponent = class extends ComponentBase {
				constructor() {
					// Resolve constructor dependencies declared via @Inject. Uses the
					// same iteration as the injector engine (one implementation).
					const dependencies = resolveInjectedParams(component, (token) => Injector.get(token));

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
