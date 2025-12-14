import type { ComponentMeta } from './types/component-meta.type';
import type { Component } from './types/component.type';
import { render } from '../template/template-result.class';
import type { Unsubscriber } from '../signals/types/unsubscriber.type';
import type { Signal } from '../signals/types/signal.type';
import { isSignal } from '../signals/functions/is-signal.function';

export abstract class ComponentBase extends HTMLElement {
	private _meta: ComponentMeta;
	private _component: Component;
	private _root: ShadowRoot;
	private _style: HTMLStyleElement;
	private _unsubscribers: Array<Unsubscriber> = [];

	constructor(meta: ComponentMeta, component: Component) {
		super();

		this._meta = meta;
		this._component = component;
		this._component.elementRef = this;
		this._root = this.attachShadow({ mode: 'open' });
		this._style = this.renderStyles();

		this.observe();

		if (this._component.onInit) {
			this._component.onInit();
		}
	}

	get component(): Component {
		return this._component;
	}

	connectedCallback(): void {
		this.render();

		if (this._component.onCreate !== undefined) {
			this._component.onCreate();
		}
	}

	disconnectedCallback(): void {
		this._unsubscribers.forEach((unsubscribe) => unsubscribe());
		this._unsubscribers = [];

		if (this._component.onDestroy !== undefined) {
			this._component.onDestroy();
		}
	}

	attributeChangedCallback(attribute: string, oldVal: unknown, newVal: unknown): void {
		if ((this._component as any)[attribute] !== undefined) {
			(this._component as any)[attribute] = newVal;
		}

		this.render();

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

	private observe(): void {
		const properties = Object.getOwnPropertyNames(this._component).filter((prop) => {
			let value = (this._component as any)[prop];

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

			return prop !== 'elementRef';
		});

		for (const prop of properties) {
			const descriptor = Object.getOwnPropertyDescriptor(this._component, prop);

			// Check if wrapper already has a value set (from property binding before observe ran)
			const wrapperValue = Object.getOwnPropertyDescriptor(this, prop)?.value;
			let value = wrapperValue !== undefined ? wrapperValue : (this._component as any)[prop];

			// Build getter/setter for the component's property
			let componentGetter = () => value;
			let componentSetter = (newVal: unknown) => {
				if (value !== newVal) {
					this._component.onPropertyChange?.(prop, value, newVal);
					value = newVal;
					this.render();
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

	private getAttributeValues(): Record<string, string> {
		const attributes: Record<string, string> = {};
		this.getAttributeNames().forEach((attrName: string) => {
			attributes[attrName] = this.getAttribute(attrName) ?? '';
		});

		return attributes;
	}

	private subscribeToSignal<T>(signal: Signal<T>): void {
		const unsubscriber = signal.subscribe(() => this.render());
		this._unsubscribers.push(unsubscriber);
	}
}
