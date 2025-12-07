import type { ComponentMeta } from './types/component-meta.type';
import type { Component } from './types/component.type';
import { render } from '../template/template';
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
		const properties = Object.getOwnPropertyNames(this._component);

		console.log('Observing component properties:', properties);

		for (const prop of properties) {
			const descriptor = Object.getOwnPropertyDescriptor(this._component, prop);

			if (descriptor?.get) {
				console.log(`Property "${prop}" has a getter; exposing on wrapper.`);
				this.exposePropertyOnWrapper(prop);
				continue;
			}

			let value = (this._component as any)[prop];

			if (descriptor?.set) {
				const originalSetter = descriptor.set;

				Object.defineProperty(this._component, prop, {
					get: () => value,
					set: (newVal) => {
						originalSetter.call(this._component, newVal);
						this.render();
					},
					enumerable: true,
					configurable: true
				});

				console.log(`Property "${prop}" has a setter; exposing on wrapper.`);
				this.exposePropertyOnWrapper(prop);
				continue;
			}

			if (isSignal(value)) {
				this.subscribeToSignal(value);
				continue;
			}

			if (typeof value === 'function') {
				continue;
			}

			Object.defineProperty(this._component, prop, {
				get: () => value,
				set: (newVal) => {
					if (value !== newVal) {
						this._component.onPropertyChange?.(prop, value, newVal);
						value = newVal;
						this.render();
					}
				},
				enumerable: true,
				configurable: true
			});

			// Expose data properties on wrapper for property binding (.prop=${value})
			console.log(`Exposing property "${prop}" on wrapper.`);
			this.exposePropertyOnWrapper(prop);
		}
	}

	/**
	 * Exposes a property on the wrapper element that proxies to the internal component.
	 * This enables property binding (.prop=${value}) from parent templates.
	 */
	private exposePropertyOnWrapper(prop: string): void {
		if (prop === 'elementRef') {
			return;
		}

		Object.defineProperty(this, prop, {
			get: () => (this._component as any)[prop],
			set: (newVal) => {
				(this._component as any)[prop] = newVal;
			},
			enumerable: true,
			configurable: true
		});
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
