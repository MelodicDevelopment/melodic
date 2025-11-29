import type { ComponentMeta } from './types/component-meta.type';
import type { Component } from './types/component.type';
import { render } from '../template/template';

export abstract class ComponentBase extends HTMLElement {
	#meta: ComponentMeta;
	#component: Component;
	#root: ShadowRoot;
	#style: HTMLStyleElement;

	constructor(meta: ComponentMeta, component: Component) {
		super();

		this.#meta = meta;
		this.#component = component;
		this.#root = this.attachShadow({ mode: 'open' });
		this.#style = this.#attachStyle();

		this.#observe();

		if (this.#component.onInit) {
			this.#component.onInit();
		}
	}

	connectedCallback(): void {
		this.#render();

		if (this.#component.onCreate !== undefined) {
			this.#component.onCreate();
		}
	}

	disconnectedCallback(): void {
		if (this.#component.onDestroy !== undefined) {
			this.#component.onDestroy();
		}
	}

	attributeChangedCallback(attribute: string, oldVal: unknown, newVal: unknown): void {
		if (this[attribute as keyof this] !== undefined) {
			(this[attribute as keyof this] as unknown) = newVal;
		}

		this.#render();

		if (this.#component.onAttributeChange !== undefined) {
			this.#component.onAttributeChange(attribute, oldVal, newVal);
		}
	}

	#render(): void {
		if (this.#meta.template) {
			const templateResult = this.#meta.template(this.#component, this.#getAttributeValues());

			if (typeof templateResult === 'string') {
				this.#root.innerHTML = templateResult;
			} else {
				render(templateResult, this.#root);
			}
		}

		if (this.#meta.styles) {
			const stylesResult = this.#meta.styles(this.#component);
			this.#style.textContent = typeof stylesResult === 'string' ? stylesResult : '';

			if (!this.#style.parentNode) {
				this.#root.appendChild(this.#style);
			}
		}

		if (this.#component.onRender !== undefined) {
			this.#component.onRender();
		}
	}

	#attachStyle(): HTMLStyleElement {
		const styleNode: HTMLStyleElement = document.createElement('style');
		return this.#root.appendChild(styleNode);
	}

	#observe(): void {
		const properties = Object.getOwnPropertyNames(this.#component);

		for (const prop of properties) {
			const descriptor = Object.getOwnPropertyDescriptor(this.#component, prop);

			if (descriptor?.get || typeof (this.#component as any)[prop] === 'function') {
				continue;
			}

			let _val = this[prop as keyof this] !== undefined ? this[prop as keyof this] : (this.#component as any)[prop];

			Object.defineProperty(this.#component, prop, {
				get: () => _val,
				set: (newVal) => {
					if (_val !== newVal) {
						this.#component.onPropertyChange?.(prop, _val, newVal);
						_val = newVal;
						this.#render();
					}
				},
				enumerable: true,
				configurable: true
			});
		}
	}

	#getAttributeValues(): Record<string, string> {
		const attributes: Record<string, string> = {};
		this.getAttributeNames().forEach((attrName: string) => {
			attributes[attrName] = this.getAttribute(attrName) ?? '';
		});

		return attributes;
	}
}
