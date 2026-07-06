import type { INewable } from '../../interfaces/inewable.interface';
import { ComponentBase } from '../classes/component-base.class';
import type { TypedComponentMeta } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { Injector } from '../../injection/classes/injection-engine.class';
import { resolveInjectedParams } from '../../injection/function/resolve-injected-params.function';
import { getActiveComponent, setActiveComponent } from '../functions/active-component.functions';
import type { Signal } from '../../signals/types/signal.type';

/**
 * Names that contain a hyphen but are reserved by the HTML/SVG/MathML specs and
 * therefore may not be used as custom element names.
 */
const RESERVED_SELECTORS = new Set([
	'annotation-xml',
	'color-profile',
	'font-face',
	'font-face-src',
	'font-face-uri',
	'font-face-format',
	'font-face-name',
	'missing-glyph'
]);

/**
 * Validates that a selector is a usable custom element name before it reaches
 * `customElements.define`, which would otherwise throw a cryptic DOMException.
 */
function assertValidSelector(selector: unknown): void {
	if (typeof selector !== 'string' || selector.length === 0) {
		throw new Error('@MelodicComponent: "selector" is required and must be a non-empty string (e.g. "app-card").');
	}
	if (!selector.includes('-')) {
		throw new Error(
			`@MelodicComponent: invalid selector "${selector}". Custom element names must contain a hyphen — use a prefixed name such as "app-${selector}".`
		);
	}
	if (!/^[a-z]/.test(selector) || /[A-Z]/.test(selector) || /\s/.test(selector)) {
		throw new Error(
			`@MelodicComponent: invalid selector "${selector}". Custom element names must start with a lowercase letter and must not contain uppercase letters or whitespace.`
		);
	}
	if (RESERVED_SELECTORS.has(selector)) {
		throw new Error(`@MelodicComponent: "${selector}" is a reserved name and cannot be used as a custom element selector.`);
	}
}

export function MelodicComponent<C extends Component>(meta: TypedComponentMeta<C>): (component: INewable<C>) => void {
	return function (component: INewable<C>): void {
		assertValidSelector(meta.selector);
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
