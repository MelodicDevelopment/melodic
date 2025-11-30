import type { ComponentMeta } from './types/component-meta.type';
import type { Component } from './types/component.type';
import { render } from '../template/template';

export abstract class ComponentBase extends HTMLElement {
	private _meta: ComponentMeta;
	private _component: Component;
	private _root: ShadowRoot;
	private _style: HTMLStyleElement;

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
		if (this._component.onDestroy !== undefined) {
			this._component.onDestroy();
		}
	}

	attributeChangedCallback(attribute: string, oldVal: unknown, newVal: unknown): void {
		if (this[attribute as keyof this] !== undefined) {
			(this[attribute as keyof this] as unknown) = newVal;
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

		for (const prop of properties) {
			const descriptor = Object.getOwnPropertyDescriptor(this._component, prop);

			if (descriptor?.get || typeof (this._component as any)[prop] === 'function') {
				continue;
			}

			let _val = this[prop as keyof this] !== undefined ? this[prop as keyof this] : (this._component as any)[prop];

			Object.defineProperty(this._component, prop, {
				get: () => _val,
				set: (newVal) => {
					if (_val !== newVal) {
						this._component.onPropertyChange?.(prop, _val, newVal);
						_val = newVal;
						this.render();
					}
				},
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
}
