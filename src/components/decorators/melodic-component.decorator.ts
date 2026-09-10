import type { INewable } from '../../interfaces/inewable.interface';
import { ComponentBase } from '../classes/component-base.class';
import type { TypedComponentMeta } from '../types/component-meta.type';
import { attributeNames } from '../types/component-meta.type';
import { registerComponentDefinition, getComponentDefinition } from '../functions/component-registry.functions';
import { devWarn, isDevMode } from '../../devtools/dev-mode';
import { emitDevtools } from '../../devtools/hook';
import { untracked } from '../../signals/functions/untracked.function';
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

/**
 * Dev-only checks on the observed-attribute list. Both failures are silent in
 * production and baffling in development: an attribute whose name has an
 * uppercase letter simply never fires (the platform lowercases attribute
 * names), and an attribute pointed at a property that holds a signal or a
 * method overwrites it with the raw attribute string.
 */
function warnAboutAttributes<C extends Component>(meta: TypedComponentMeta<C>, component: INewable<C>): void {
	if (!isDevMode()) {
		return;
	}

	for (const name of attributeNames(meta.attributes)) {
		if (/[A-Z]/.test(name)) {
			devWarn(
				`attr-case:${meta.selector}:${name}`,
				`<${meta.selector}> observes attribute "${name}", which can never fire — HTML lowercases attribute names. ` +
					`Use "${name.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}" (it maps to the "${name}" property).`
			);
		}
	}

	const prototype = component.prototype as Record<string, unknown> | undefined;
	if (!prototype) {
		return;
	}

	for (const name of attributeNames(meta.attributes)) {
		const prop = name.replace(/-([a-z])/g, (_, ch: string) => (ch as string).toUpperCase());
		if (typeof prototype[prop] === 'function') {
			devWarn(
				`attr-method:${meta.selector}:${name}`,
				`<${meta.selector}> observes attribute "${name}", but "${prop}" is a method. ` +
					'Setting the attribute would replace the method with the attribute string.'
			);
		}
	}
}

export function MelodicComponent<C extends Component>(meta: TypedComponentMeta<C>): (component: INewable<C>) => void {
	return function (component: INewable<C>): void {
		assertValidSelector(meta.selector);
		warnAboutAttributes(meta, component);

		const existing = getComponentDefinition(meta.selector);
		if (existing && existing.componentClass !== component) {
			devWarn(
				`duplicate-selector:${meta.selector}`,
				`Two classes were registered as <${meta.selector}> ('${(existing.componentClass as { name?: string })?.name ?? 'unknown'}' and ` +
					`'${component.name}'). The first registration wins and the second is ignored — custom element names are global.`
			);
		}

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
						// untracked: field initializers belong to this component,
						// not to whichever parent render effect is upgrading it.
						userInstance = untracked(() => Reflect.construct(component, dependencies) as C);
					} finally {
						setActiveComponent(prevActive);
					}

					super(meta, userInstance, { disposables, selectCache });
				}

				public static readonly observedAttributes: string[] = attributeNames(meta.attributes);
			};

			const componentWithSelector: INewable<C> & { selector?: string } = component as INewable<C> & { selector?: string };
			componentWithSelector.selector = meta.selector;

			customElements.define(meta.selector, webComponent);
		}

		registerComponentDefinition({ selector: meta.selector, componentClass: component, meta: meta as TypedComponentMeta<Component> });
		emitDevtools('component:define', () => ({ selector: meta.selector, className: component.name }));
	};
}
