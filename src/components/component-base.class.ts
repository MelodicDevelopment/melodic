import type { IComponentMeta } from './interfaces/icomponent-meta.interface';
import type { IComponent } from './interfaces/icomponent.interface';
import { render } from '../template/template';

export abstract class ComponentBase extends HTMLElement {
	#meta: IComponentMeta;
	#component: IComponent;
	#root: ShadowRoot;
	#style: HTMLStyleElement;

	constructor(meta: IComponentMeta, component: IComponent) {
		super();

		this.#meta = meta;
		this.#component = component;
		this.#root = this.attachShadow({ mode: 'open' });
		this.#style = this.#attachStyle();

		this.#observe();

		if (this.#component.onInit) {
			this.#component.onInit();
		}

		console.log(`Component '${this.#meta.selector}' initialized.`);
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
		// Render template if provided
		if (this.#meta.template) {
			const templateResult = this.#meta.template(this.#component, this.#getAttributeValues());

			if (typeof templateResult === 'string') {
				// Simple string template
				this.#root.innerHTML = templateResult;
			} else {
				// TemplateResult from html`` tagged template
				render(templateResult, this.#root);
			}
		}

		// Render styles if provided
		if (this.#meta.styles) {
			const stylesResult = this.#meta.styles(this.#component);
			this.#style.textContent = typeof stylesResult === 'string' ? stylesResult : '';
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
		const properties: string[] = Object.getOwnPropertyNames(this.#component);
		properties.forEach((prop) => {
			const self: any = this;

			let _val: unknown = (this.#component as any)[prop];

			if (self[prop] !== undefined) {
				_val = self[prop];
			}

			const getter = () => _val;
			const setter = (newVal: unknown) => {
				if (_val !== newVal) {
					if (this.#component.onPropertyChange !== undefined) {
						this.#component.onPropertyChange(prop, _val, newVal);
					}

					_val = newVal;
					this.#render();
				}
			};

			Object.defineProperty(this.#component, prop, { get: getter, set: setter });
		});
	}

	// #getTemplate(): ((...args: any[]) => TemplateResult) | null {
	// 	const template = this.#meta.template;

	// 	if (typeof template === 'string') {
	// 		return () => template;
	// 	}

	// 	return template ?? null;
	// }

	// #getStyles(): ((...args: any[]) => TemplateResult) | null {
	// 	const styles = this.#meta.styles;

	// 	if (typeof styles === 'string') {
	// 		return () => styles;
	// 	}

	// 	return styles ?? null;
	// }

	#getAttributeValues(): Record<string, string> {
		const attributes: Record<string, string> = {};
		this.getAttributeNames().forEach((attrName: string) => {
			attributes[attrName] = this.getAttribute(attrName) ?? '';
		});

		return attributes;
	}
}
