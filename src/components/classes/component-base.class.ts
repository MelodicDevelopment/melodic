import type { ComponentMeta } from '../types/component-meta.type';
import type { Component } from '../types/component.type';
import { render } from '../../template/functions/render.function';
import type { Unsubscriber } from '../../signals/types/unsubscriber.type';
import type { Signal } from '../../signals/types/signal.type';
import { isSignal } from '../../signals/functions/is-signal.function';
import type { ITemplatePart } from '../../template/interfaces/itemplate-part.interface';
import { applyGlobalStyles } from '../styles/apply-global-styles.function';

export abstract class ComponentBase extends HTMLElement {
	private readonly _meta: ComponentMeta;
	private readonly _component: Component;
	private readonly _root: ShadowRoot;
	private readonly _style: HTMLStyleElement;
	private _unsubscribers: Array<Unsubscriber> = [];
	private _renderScheduled = false;
	private _booleanProperties: Set<string> = new Set();

	constructor(meta: ComponentMeta, component: Component) {
		super();

		this._meta = meta;
		this._component = component;
		this._component.elementRef = this;
		this._root = this.attachShadow({ mode: 'open' });
		applyGlobalStyles(this._root);
		this._style = this.renderStyles();

		this.observe();

		if (this._component.onInit) {
			this._component.onInit();
		}
	}

	get component(): Component {
		return this._component;
	}

	async connectedCallback(): Promise<void> {
		this.render();

		if (this._component.onCreate !== undefined) {
			this._component.onCreate();
		}
	}

	disconnectedCallback(): void {
		this._unsubscribers.forEach((unsubscribe) => unsubscribe());
		this._unsubscribers = [];

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

		if (this._component.onDestroy !== undefined) {
			this._component.onDestroy();
		}
	}

	attributeChangedCallback(attribute: string, oldVal: unknown, newVal: unknown): void {
		if ((this._component as any)[attribute] !== undefined) {
			let value = newVal;

			// Convert boolean attributes: present (any value including "") = true, null/absent = false
			if (this._booleanProperties.has(attribute)) {
				value = newVal !== null && newVal !== 'false';
			}

			(this._component as any)[attribute] = value;
		}

		this.scheduleRender();

		if (this._component.onAttributeChange !== undefined) {
			this._component.onAttributeChange(attribute, oldVal, newVal);
		}
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
			const value = (this._component as any)[prop];

			// Skip private properties (convention)
			if (prop.startsWith('_')) {
				return false;
			}

			if (isSignal(value)) {
				this.subscribeToSignal(value);
				return false;
			}

			if (typeof value === 'function') {
				return false;
			}

			return prop !== 'elementRef' && prop !== 'constructor';
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
				if (value !== newVal) {
					this._component.onPropertyChange?.(prop, value, newVal);
					value = newVal;
					this.scheduleRender();
				}
			};

			// Preserve existing getters
			if (descriptor?.get) {
				const originalGetter = descriptor.get;
				componentGetter = () => originalGetter.call(this._component) ?? value;
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

	private subscribeToSignal<T>(signal: Signal<T>): void {
		const unsubscriber = signal.subscribe(() => this.scheduleRender());
		this._unsubscribers.push(unsubscriber);
	}
}
