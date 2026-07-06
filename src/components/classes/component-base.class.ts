import type { ComponentMeta } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { render } from '../../template/functions/render.function';
import type { Unsubscriber } from '../../signals/types/unsubscriber.type';
import type { Signal } from '../../signals/types/signal.type';
import { isSignal } from '../../signals/functions/is-signal.function';
import type { IRenderedContainer } from '../../template/interfaces/irendered-container.interface';
import { disposeParts } from '../../template/functions/dispose.functions';
import { applyGlobalStyles } from '../styles/apply-global-styles.function';
import { getComponentStyleSheet } from '../styles/component-style-sheets.function';
import { AbstractControl } from '../../forms/classes/abstract-control.class';
import { getActiveComponent, setActiveComponent } from '../functions/active-component.functions';

export interface PendingComponentScope {
	disposables: Set<{ destroy(): void }>;
	selectCache: Map<string, Signal<unknown>>;
}

/** Attribute coercion types a component may declare via `static propertyTypes`. */
export type PropertyType = 'boolean' | 'number' | 'string';

/**
 * A reactive source property (a component field holding a Signal or an
 * AbstractControl). Tracks the signals to (re)subscribe on connect and the
 * live unsubscribers, so the subscription can follow a reassignment of the
 * field (e.g. `this.form = createFormGroup(...)`).
 */
interface ReactiveSourceEntry {
	signals: Array<Signal<unknown>>;
	unsubscribers: Array<Unsubscriber>;
}

export abstract class ComponentBase extends HTMLElement {
	private readonly _meta: ComponentMeta;
	private readonly _component: Component;
	private readonly _root: ShadowRoot;
	// Fallback per-instance <style> element — only used when shared constructed
	// stylesheets are unavailable (see renderStyles()).
	private readonly _style: HTMLStyleElement | null;
	private _renderScheduled = false;
	private readonly _booleanProperties: Set<string> = new Set();
	private readonly _numberProperties: Set<string> = new Set();
	private readonly _stringProperties: Set<string> = new Set();
	private readonly _disposables: Set<{ destroy(): void }>;
	private readonly _selectCache: Map<string, Signal<unknown>>;

	// Reactive signal/control sources discovered during observe(). Subscribed on
	// every connect and torn down on every disconnect, so reactivity survives the
	// element being moved in the DOM. Entries are swapped in place when the
	// component reassigns a source field, so reactivity follows reassignment.
	private readonly _reactiveSourceEntries: Array<ReactiveSourceEntry> = [];

	private _created = false;
	private _destroyed = false;
	private _teardownScheduled = false;

	constructor(meta: ComponentMeta, component: Component, pending?: PendingComponentScope) {
		super();

		this._meta = meta;
		this._component = component;
		this._component.elementRef = this;

		// Components may declare attribute→property coercion types explicitly for
		// properties whose initial value doesn't reveal the type (e.g. `open?: boolean`):
		//   static propertyTypes = { open: 'boolean', offset: 'number' };
		const declaredTypes = (component.constructor as { propertyTypes?: Record<string, PropertyType> }).propertyTypes;
		if (declaredTypes) {
			for (const [prop, type] of Object.entries(declaredTypes)) {
				if (type === 'boolean') this._booleanProperties.add(prop);
				else if (type === 'number') this._numberProperties.add(prop);
				else if (type === 'string') this._stringProperties.add(prop);
			}
		}
		// Adopt the same Set/Map the decorator used during Reflect.construct so
		// disposables and cache entries from class-field initializers belong to us.
		this._disposables = pending?.disposables ?? new Set();
		this._selectCache = pending?.selectCache ?? new Map();
		this._root = this.attachShadow({ mode: 'open' });
		applyGlobalStyles(this._root);
		this._style = this.renderStyles();

		this.observe();

		if (this._component.onInit) {
			this._component.onInit();
		}
	}

	public get component(): Component {
		return this._component;
	}

	public registerDisposable(d: { destroy(): void }): void {
		this._disposables.add(d);
	}

	public getSelectCache(): Map<string, Signal<unknown>> {
		return this._selectCache;
	}

	public connectedCallback(): void {
		// A reconnect cancels any pending teardown from a just-prior disconnect,
		// so moving the element in the DOM does not destroy its state.
		this._teardownScheduled = false;

		this.subscribeReactiveSources();
		this.render();

		const prev = getActiveComponent();
		setActiveComponent(this);
		try {
			// onCreate fires exactly once, the first time the element enters the DOM.
			if (!this._created) {
				this._created = true;
				this._component.onCreate?.();
			}
			// onConnect fires on every connect (including the first).
			this._component.onConnect?.();
		} finally {
			setActiveComponent(prev);
		}
	}

	public disconnectedCallback(): void {
		// Tear down reactive subscriptions immediately so a detached element stops
		// reacting; they are re-established on the next connect.
		for (const entry of this._reactiveSourceEntries) {
			for (const unsubscribe of entry.unsubscribers) {
				unsubscribe();
			}
			entry.unsubscribers = [];
		}

		this._component.onDisconnect?.();

		// Defer destruction of owned resources (forms/signals/directives) to a
		// microtask. A transient move (remove + re-add) reconnects first and
		// cancels this, so re-parenting preserves component state.
		if (!this._teardownScheduled && !this._destroyed) {
			this._teardownScheduled = true;
			queueMicrotask(() => {
				this._teardownScheduled = false;
				if (!this.isConnected && !this._destroyed) {
					this.teardown();
				}
			});
		}
	}

	public attributeChangedCallback(attribute: string, oldVal: unknown, newVal: unknown): void {
		const prop = attribute.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
		const component = this._component as unknown as Record<string, unknown>;

		const current = component[prop];
		const value = this.coerceAttributeValue(prop, newVal as string | null, current);

		// Skip the assignment and re-render when the reflected value is
		// identical — avoids render churn from equal attribute writes.
		if (!Object.is(current, value)) {
			component[prop] = value;
			this.scheduleRender();
		}

		if (this._component.onAttributeChange !== undefined) {
			this._component.onAttributeChange(attribute, oldVal, newVal);
		}
	}

	/**
	 * Coerce an observed attribute's string value by the property's declared
	 * type. Type is determined by, in order: an explicit `static propertyTypes`
	 * declaration, the property's initial value type (captured in observe()),
	 * or the property's CURRENT value type. Properties with no type information
	 * (e.g. `open?: boolean` with no initializer) recognize the canonical
	 * boolean literals "true"/"false"; everything else passes through raw.
	 */
	private coerceAttributeValue(prop: string, raw: string | null, current: unknown): unknown {
		// Explicitly declared string properties are never coerced.
		if (this._stringProperties.has(prop)) {
			return raw;
		}

		// Boolean: present (any value except the literal "false") = true, absent = false.
		if (this._booleanProperties.has(prop) || typeof current === 'boolean') {
			return raw !== null && raw !== 'false';
		}

		// Number: coerce numeric strings; leave null (attribute removed) and
		// non-numeric garbage untouched rather than producing NaN.
		if (this._numberProperties.has(prop) || typeof current === 'number') {
			if (raw === null || raw.trim() === '') {
				return raw;
			}
			const parsed = Number(raw);
			return Number.isNaN(parsed) ? raw : parsed;
		}

		// No type information: recognize canonical boolean literals so an
		// initially-undefined `open?: boolean` never receives the truthy string "false".
		if ((current === undefined || current === null) && (raw === 'true' || raw === 'false')) {
			return raw === 'true';
		}

		return raw;
	}

	/** Final destruction — runs once when the element is permanently removed. */
	private teardown(): void {
		this._destroyed = true;

		// Recursively dispose the rendered part tree: action-directive cleanups
		// (e.g. clickOutside document listeners) plus everything nested inside
		// when/repeat branches, nested templates, and array items.
		const parts = (this._root as ShadowRoot & IRenderedContainer).__parts;
		if (parts) {
			disposeParts(parts);
		}

		// User's onDestroy runs first so user code can still reference signals before they're destroyed.
		if (this._component.onDestroy !== undefined) {
			this._component.onDestroy();
		}

		for (const d of this._disposables) {
			try {
				d.destroy();
			} catch (error) {
				console.error('Disposable cleanup failed:', error);
			}
		}
		this._disposables.clear();
		this._selectCache.clear();
	}

	/**
	 * Applies the component's styles to its shadow root.
	 *
	 * Preferred path: one shared CSSStyleSheet per component class, adopted via
	 * adoptedStyleSheets (no per-instance <style> element, one CSS parse per
	 * class). Fallback path (constructed stylesheets unsupported): the original
	 * per-instance <style> element, returned so render() can re-append it after
	 * the first template render wipes the root.
	 */
	private renderStyles(): HTMLStyleElement | null {
		if (!this._meta.styles) {
			return null;
		}

		const sheet = getComponentStyleSheet(this._meta.styles);
		if (sheet) {
			this._root.adoptedStyleSheets = [...this._root.adoptedStyleSheets, sheet];
			return null;
		}

		const styleNode: HTMLStyleElement = document.createElement('style');
		render(this._meta.styles(), styleNode);

		return this._root.appendChild(styleNode);
	}

	private render(): void {
		const prev = getActiveComponent();
		setActiveComponent(this);
		try {
			if (this._meta.template) {
				const templateResult = this._meta.template(this._component, this.getAttributeValues());
				render(templateResult, this._root);

				if (this._style && this._style.parentNode !== this._root) {
					this._root.appendChild(this._style);
				}
			}

			if (this._component.onRender !== undefined) {
				this._component.onRender();
			}
		} finally {
			setActiveComponent(prev);
		}
	}

	private scheduleRender(): void {
		if (this._renderScheduled) {
			return;
		}

		this._renderScheduled = true;
		queueMicrotask(() => {
			this._renderScheduled = false;
			if (this.isConnected) {
				this.render();
			}
		});
	}

	private observe(): void {
		const properties: string[] = [];
		const seen = new Set<string>();
		let proto: object | null = this._component;

		while (proto && proto !== Object.prototype) {
			for (const prop of Object.getOwnPropertyNames(proto)) {
				if (!seen.has(prop)) {
					seen.add(prop);
					properties.push(prop);
				}
			}
			proto = Object.getPrototypeOf(proto);
		}

		// Public getter-only accessors (computed properties): not reactive data,
		// but still part of the element's public surface. Mirrored onto the host
		// as lazy passthroughs after the reactive props are wired (see below).
		const getterOnly: string[] = [];

		// Properties holding a reactive source (Signal / AbstractControl). Wired
		// after the data props so reassignment swaps the render subscription.
		const sourceProps: string[] = [];

		const filtered = properties.filter((prop) => {
			// Skip private properties (convention) and framework-internal fields.
			if (prop.startsWith('_') || prop === 'elementRef' || prop === 'constructor') {
				return false;
			}

			const descriptor = this.getPropertyDescriptor(this._component, prop);

			// Skip getter-only accessors (e.g. @Service fields): leave their lazy,
			// per-instance-cached getter intact rather than eagerly reading it and
			// reifying it as a reactive data property. Public ones are still
			// surfaced on the host (without invoking the getter here).
			if (descriptor && descriptor.get && !descriptor.set) {
				getterOnly.push(prop);
				return false;
			}

			const value = (this._component as any)[prop];

			// Signals and form controls are reactive sources, not reactive data —
			// subscribe to them for re-renders, but don't wrap them as data.
			if (isSignal(value) || value instanceof AbstractControl) {
				sourceProps.push(prop);
				return false;
			}

			if (typeof value === 'function') {
				return false;
			}

			return true;
		});

		for (const prop of sourceProps) {
			this.observeReactiveSource(prop);
		}

		for (const prop of filtered) {
			const descriptor = this.getPropertyDescriptor(this._component, prop);

			// Check if wrapper already has a value set (from property binding before observe ran)
			const wrapperValue = Object.getOwnPropertyDescriptor(this, prop)?.value;
			let value = wrapperValue === undefined ? (this._component as any)[prop] : wrapperValue;

			// Track boolean/number properties for attribute coercion (explicit
			// `static propertyTypes` declarations were seeded in the constructor).
			if (typeof value === 'boolean') {
				this._booleanProperties.add(prop);
			} else if (typeof value === 'number') {
				this._numberProperties.add(prop);
			}

			// Build getter/setter for the component's property
			let componentGetter = () => value;
			let componentSetter = (newVal: unknown) => {
				if (!Object.is(value, newVal)) {
					this._component.onPropertyChange?.(prop, value, newVal);
					value = newVal;
					this.scheduleRender();
				}
			};

			// Preserve existing getters — return the real getter result (including
			// legitimate falsy values like 0, '', false, null).
			if (descriptor?.get) {
				const originalGetter = descriptor.get;
				componentGetter = () => originalGetter.call(this._component);
			}

			// Preserve existing setters
			if (descriptor?.set) {
				const originalSetter = descriptor.set;
				const baseSetter = componentSetter;
				componentSetter = (newVal) => {
					originalSetter.call(this._component, newVal);
					baseSetter(newVal);
				};
			}

			// Make the component's property reactive
			Object.defineProperty(this._component, prop, {
				get: componentGetter,
				set: componentSetter,
				enumerable: true,
				configurable: true
			});

			// Expose on wrapper for property binding (.prop=${value})
			Object.defineProperty(this, prop, {
				get: componentGetter,
				set: componentSetter,
				enumerable: true,
				configurable: true
			});
		}

		// Mirror public computed getters onto the host so `el.prop` reads the live
		// value. The passthrough delegates to the component lazily — it never
		// invokes the getter during observe(), so @Service-style lazy getters keep
		// their deferred resolution. A no-op setter keeps accidental writes from
		// throwing (a computed property has nothing to assign to).
		for (const prop of getterOnly) {
			if (Object.prototype.hasOwnProperty.call(this, prop)) {
				continue;
			}

			Object.defineProperty(this, prop, {
				get: () => (this._component as any)[prop],
				set: () => {},
				enumerable: true,
				configurable: true
			});
		}
	}

	private getPropertyDescriptor(target: object, prop: string): PropertyDescriptor | undefined {
		let current: object | null = target;

		while (current && current !== Object.prototype) {
			const descriptor = Object.getOwnPropertyDescriptor(current, prop);
			if (descriptor) {
				return descriptor;
			}
			current = Object.getPrototypeOf(current);
		}

		return undefined;
	}

	private getAttributeValues(): Record<string, string> {
		const attributes: Record<string, string> = {};
		this.getAttributeNames().forEach((attrName: string) => {
			attributes[attrName] = this.getAttribute(attrName) ?? '';
		});

		return attributes;
	}

	private subscribeReactiveSources(): void {
		if (this._destroyed) {
			return;
		}

		for (const entry of this._reactiveSourceEntries) {
			// Defensive: never double-subscribe an entry.
			for (const unsubscribe of entry.unsubscribers) {
				unsubscribe();
			}
			entry.unsubscribers = entry.signals.map((signal) => signal.subscribe(() => this.scheduleRender()));
		}
	}

	/** The signals a reactive-source value contributes re-render subscriptions for. */
	private collectSourceSignals(value: unknown): Array<Signal<unknown>> {
		if (isSignal(value)) {
			return [value as Signal<unknown>];
		}

		if (value instanceof AbstractControl) {
			// Re-render when either the control's value OR its status (state)
			// changes, so templates reading control.value() stay in sync even
			// when the value change doesn't alter dirty/touched/validity.
			return [value.value as Signal<unknown>, value.state as Signal<unknown>];
		}

		return [];
	}

	/**
	 * Wire a component field holding a Signal/AbstractControl so its render
	 * subscription follows reassignment: `this.form = createFormGroup(...)`
	 * after construction unsubscribes the old source and subscribes the new one
	 * instead of silently going inert.
	 */
	private observeReactiveSource(prop: string): void {
		const component = this._component as unknown as Record<string, unknown>;
		const entry: ReactiveSourceEntry = {
			signals: this.collectSourceSignals(component[prop]),
			unsubscribers: []
		};
		this._reactiveSourceEntries.push(entry);

		const descriptor = this.getPropertyDescriptor(this._component, prop);
		if (descriptor && (descriptor.get || descriptor.set)) {
			// Custom accessor — leave it intact and subscribe to the
			// construction-time snapshot only (pre-existing behavior).
			return;
		}

		let current = component[prop];

		Object.defineProperty(this._component, prop, {
			get: () => current,
			set: (newVal: unknown) => {
				if (Object.is(current, newVal)) {
					return;
				}

				this._component.onPropertyChange?.(prop, current, newVal);
				current = newVal;

				// Swap the render subscription to the new source.
				for (const unsubscribe of entry.unsubscribers) {
					unsubscribe();
				}
				entry.unsubscribers = [];
				entry.signals = this.collectSourceSignals(newVal);

				if (this.isConnected && !this._destroyed) {
					entry.unsubscribers = entry.signals.map((signal) => signal.subscribe(() => this.scheduleRender()));
				}

				this.scheduleRender();
			},
			enumerable: true,
			configurable: true
		});
	}
}
