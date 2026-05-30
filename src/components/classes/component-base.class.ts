import type { ComponentMeta } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { render } from '../../template/functions/render.function';
import type { Unsubscriber } from '../../signals/types/unsubscriber.type';
import type { Signal } from '../../signals/types/signal.type';
import { isSignal } from '../../signals/functions/is-signal.function';
import type { ITemplatePart } from '../../template/interfaces/itemplate-part.interface';
import { applyGlobalStyles } from '../styles/apply-global-styles.function';
import { AbstractControl } from '../../forms/classes/abstract-control.class';
import { getActiveComponent, setActiveComponent } from '../functions/active-component.functions';

export interface PendingComponentScope {
	disposables: Set<{ destroy(): void }>;
	selectCache: Map<string, Signal<unknown>>;
}

export abstract class ComponentBase extends HTMLElement {
	private readonly _meta: ComponentMeta;
	private readonly _component: Component;
	private readonly _root: ShadowRoot;
	private readonly _style: HTMLStyleElement;
	private _unsubscribers: Array<Unsubscriber> = [];
	private _renderScheduled = false;
	private readonly _booleanProperties: Set<string> = new Set();
	private readonly _disposables: Set<{ destroy(): void }>;
	private readonly _selectCache: Map<string, Signal<unknown>>;

	// Reactive signal/control sources discovered during observe(). Subscribed on
	// every connect and torn down on every disconnect, so reactivity survives the
	// element being moved in the DOM.
	private readonly _reactiveSources: Array<Signal<unknown>> = [];

	private _created = false;
	private _destroyed = false;
	private _teardownScheduled = false;

	constructor(meta: ComponentMeta, component: Component, pending?: PendingComponentScope) {
		super();

		this._meta = meta;
		this._component = component;
		this._component.elementRef = this;
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
		this._unsubscribers.forEach((unsubscribe) => unsubscribe());
		this._unsubscribers = [];

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

		if ((this._component as any)[prop] !== undefined) {
			let value = newVal;

			// Convert boolean attributes: present (any value including "") = true, null/absent = false
			if (this._booleanProperties.has(prop)) {
				value = newVal !== null && newVal !== 'false';
			}

			(this._component as any)[prop] = value;
		}

		this.scheduleRender();

		if (this._component.onAttributeChange !== undefined) {
			this._component.onAttributeChange(attribute, oldVal, newVal);
		}
	}

	/** Final destruction — runs once when the element is permanently removed. */
	private teardown(): void {
		this._destroyed = true;

		// Run action-directive cleanups (e.g. clickOutside document listeners).
		const parts = (this._root as any).__parts as ITemplatePart[] | undefined;
		if (parts) {
			for (const part of parts) {
				if (part.actionCleanup) {
					try {
						part.actionCleanup();
					} catch (error) {
						console.error('Action directive cleanup failed:', error);
					} finally {
						part.actionCleanup = undefined;
					}
				}
			}
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

	private renderStyles(): HTMLStyleElement {
		const styleNode: HTMLStyleElement = document.createElement('style');

		if (this._meta.styles) {
			const stylesResult = this._meta.styles();
			render(stylesResult, styleNode);
		}

		return this._root.appendChild(styleNode);
	}

	private render(): void {
		const prev = getActiveComponent();
		setActiveComponent(this);
		try {
			if (this._meta.template) {
				const templateResult = this._meta.template(this._component, this.getAttributeValues());
				render(templateResult, this._root);

				if (this._style.parentNode !== this._root) {
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

		const filtered = properties.filter((prop) => {
			// Skip private properties (convention) and framework-internal fields.
			if (prop.startsWith('_') || prop === 'elementRef' || prop === 'constructor') {
				return false;
			}

			const descriptor = this.getPropertyDescriptor(this._component, prop);

			// Skip getter-only accessors (e.g. @Service fields): leave their lazy,
			// per-instance-cached getter intact rather than eagerly reading it and
			// reifying it as a reactive data property.
			if (descriptor && descriptor.get && !descriptor.set) {
				return false;
			}

			const value = (this._component as any)[prop];

			// Signals and form controls are reactive sources, not reactive data —
			// collect them to subscribe on connect, but don't wrap them.
			if (isSignal(value)) {
				this._reactiveSources.push(value as Signal<unknown>);
				return false;
			}

			if (value instanceof AbstractControl) {
				this._reactiveSources.push(value.state as Signal<unknown>);
				return false;
			}

			if (typeof value === 'function') {
				return false;
			}

			return true;
		});

		for (const prop of filtered) {
			const descriptor = this.getPropertyDescriptor(this._component, prop);

			// Check if wrapper already has a value set (from property binding before observe ran)
			const wrapperValue = Object.getOwnPropertyDescriptor(this, prop)?.value;
			let value = wrapperValue === undefined ? (this._component as any)[prop] : wrapperValue;

			// Track boolean properties for attribute conversion
			if (typeof value === 'boolean') {
				this._booleanProperties.add(prop);
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

		for (const source of this._reactiveSources) {
			this._unsubscribers.push(source.subscribe(() => this.scheduleRender()));
		}
	}
}
