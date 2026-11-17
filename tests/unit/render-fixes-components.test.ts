import { describe, it, expect, vi, afterEach } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { globalStyleBookkeeping } from '../../src/components/styles/apply-global-styles.function';
import { getComponentStyleSheet, getComponentStyleText } from '../../src/components/styles/component-style-sheets.function';
import { html, css, render } from '../../src/template';
import { signal, computed } from '../../src/signals';
import { DEPENDENTS } from '../../src/signals/types/signal.type';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

let uid = 0;
const nextTag = (prefix: string): string => `rf-${prefix}-${++uid}`;

type AnyElement = HTMLElement & Record<string, any>;

/**
 * Simulate properties assigned to an element BEFORE it was upgraded — what a
 * parent template does, because it commits bindings on a clone that is not yet
 * connected. happy-dom constructs custom elements eagerly, so the values are
 * planted at the first thing the base constructor does to the element.
 */
function presetBeforeUpgrade(values: Record<string, unknown>): void {
	const original = HTMLElement.prototype.attachShadow;
	const spy = vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementation(function (this: HTMLElement, init: ShadowRootInit) {
		spy.mockRestore();
		Object.assign(this, values);
		return original.call(this, init);
	});
}

afterEach(() => {
	setDevMode(null);
	resetDevWarnings();
	vi.restoreAllMocks();
});

describe('review 2026-11 — global style bookkeeping', () => {
	it('does not park shadow roots forever when there is no melodic-styles sheet', async () => {
		const tag = nextTag('leak');
		class Host {
			public value = 1;
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.value}</p>` })(Host as never);

		// Let the one-off global style load settle.
		const first = document.createElement(tag);
		document.body.appendChild(first);
		await flush();
		first.remove();
		await flush();

		for (let i = 0; i < 10; i++) {
			const element = document.createElement(tag);
			document.body.appendChild(element);
			element.remove();
		}
		await flush();

		// Before the fix every root created after the load sat in a strong Set.
		expect(globalStyleBookkeeping().pendingRoots).toBe(0);
	});
});

describe('review 2026-11 — re-attaching after teardown', () => {
	it('tears the revived element down again on the next removal', async () => {
		const service = signal('a');
		const dependents = (service as unknown as Record<symbol, Set<unknown>>)[DEPENDENTS];
		const tag = nextTag('revive');
		let destroyed = 0;

		class Host {
			public onDestroy(): void {
				destroyed++;
			}
		}
		MelodicComponent({ selector: tag, template: () => html`<p>${service()}</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();
		element.remove();
		await flush();
		expect(dependents.size).toBe(0);

		document.body.appendChild(element);
		await flush();
		expect(dependents.size).toBe(1);
		service.set('b');
		await flush();
		expect(element.shadowRoot!.textContent).toContain('b');

		// The render effect created on re-attach used to outlive the element.
		element.remove();
		await flush();
		expect(dependents.size).toBe(0);
		// onDestroy keeps its "once" contract.
		expect(destroyed).toBe(1);
	});

	it('re-subscribes signal fields after being re-attached', async () => {
		const tag = nextTag('revive-field');
		let renders = 0;
		class Host {
			public count = signal(0);
			public onRender(): void {
				renders++;
			}
		}
		// The template does not read the signal: only the field subscription can re-render.
		MelodicComponent({ selector: tag, template: () => html`<p>static</p>` })(Host as never);

		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);
		await flush();
		element.remove();
		await flush();
		document.body.appendChild(element);
		await flush();

		const before = renders;
		element.component.count.set(5);
		await flush();
		expect(renders).toBe(before + 1);
		element.remove();
	});

	it('warns in dev when the component owned resources that were destroyed', async () => {
		setDevMode(true);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const source = signal(1);
		const tag = nextTag('revive-warn');
		class Host {
			public doubled = computed(() => source() * 2);
		}
		MelodicComponent({ selector: tag, template: () => html`<p>static</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		await flush();
		element.remove();
		await flush();
		document.body.appendChild(element);
		await flush();

		expect(warn.mock.calls.some((call) => String(call[1]).includes('attached again after it had been destroyed'))).toBe(true);
		element.remove();
	});
});

describe('review 2026-11 — render loop guard', () => {
	it('catches up after a legitimate burst of awaited updates', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const tag = nextTag('burst');
		class Host {
			public count = 0;
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.count}</p>` })(Host as never);

		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);

		for (let i = 1; i <= 40; i++) {
			element.count = i;
			await Promise.resolve();
			await Promise.resolve();
		}
		await flush();
		await flush();
		await flush();

		expect(element.shadowRoot!.textContent).toBe('40');
		element.remove();
		errorSpy.mockRestore();
	});

	it('still stops a real loop, after one catch-up attempt', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const tag = nextTag('loop');
		let renders = 0;
		class Host {
			public count = 0;
			public onRender(): void {
				renders++;
				this.count = this.count + 1;
			}
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.count}</p>` })(Host as never);

		const element = document.createElement(tag);
		document.body.appendChild(element);
		for (let i = 0; i < 8; i++) {
			await flush();
		}

		const settled = renders;
		expect(settled).toBeLessThanOrEqual(60);
		await flush();
		await flush();
		expect(renders).toBe(settled);
		// One report, not one per burst.
		expect(errorSpy.mock.calls.filter((call) => String(call[0]).includes('render loop'))).toHaveLength(1);

		element.remove();
		errorSpy.mockRestore();
	});

	it('does not arm a timer per component', () => {
		const tag = nextTag('timer');
		class Host {
			public value = 1;
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.value}</p>` })(Host as never);

		const timeouts = vi.spyOn(globalThis, 'setTimeout');
		const elements: HTMLElement[] = [];
		for (let i = 0; i < 50; i++) {
			const element = document.createElement(tag);
			document.body.appendChild(element);
			elements.push(element);
		}

		expect(timeouts.mock.calls.length).toBeLessThanOrEqual(1);
		for (const element of elements) {
			element.remove();
		}
	});
});

describe('review 2026-11 — fields a parent could not reach', () => {
	it('accepts a function bound to a function-valued field', async () => {
		const tag = nextTag('fn-field');
		class Host {
			public formatter = (value: string): string => value;
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.formatter('v')}</p>` })(Host as never);

		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);
		element.formatter = (value: string): string => value.toUpperCase();
		await flush();

		expect(element.shadowRoot!.textContent).toBe('V');
		expect(element.formatter('x')).toBe('X');
		element.remove();
	});

	it('forwards a function bound by a parent template before the child is upgraded', async () => {
		const tag = nextTag('fn-child');
		class Host {
			public formatter = (value: string): string => value;
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.formatter('v')}</p>` })(Host as never);

		presetBeforeUpgrade({ formatter: (value: string): string => `<${value}>` });
		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);
		await flush();

		expect(element.shadowRoot!.textContent).toBe('<v>');
		// The stray instance property is gone; the class accessor answers.
		expect(Object.prototype.hasOwnProperty.call(element, 'formatter')).toBe(false);
		element.remove();
	});

	it('does not put prototype methods on the element', () => {
		const tag = nextTag('method');
		class Host {
			public value = 1;
			public open(): void {
				this.value++;
			}
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.value}</p>` })(Host as never);
		const element = document.createElement(tag) as AnyElement;
		expect(element.open).toBeUndefined();
	});

	it('writes a plain value bound to a signal field INTO the signal', async () => {
		const tag = nextTag('signal-field');
		class Host {
			public value = signal('initial');
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.value()}</p>` })(Host as never);

		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);
		const original = element.component.value;

		element.value = 'bound';
		await flush();

		expect(element.component.value).toBe(original);
		expect(original()).toBe('bound');
		expect(element.shadowRoot!.textContent).toBe('bound');

		// A signal bound to a signal field replaces it.
		const replacement = signal('replaced');
		element.value = replacement;
		await flush();
		expect(element.component.value).toBe(replacement);
		expect(element.shadowRoot!.textContent).toBe('replaced');
		element.remove();
	});

	it('reaches an observed attribute property that has no initializer', async () => {
		const tag = nextTag('attr-prop');
		class Host {
			public open?: boolean;
		}
		MelodicComponent({ selector: tag, attributes: { open: 'boolean' }, template: (c: Host) => html`<p>${c.open ? 'open' : 'closed'}</p>` })(Host as never);

		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);
		await flush();
		expect(element.shadowRoot!.textContent).toBe('closed');

		element.open = true;
		await flush();
		expect(element.component.open).toBe(true);
		expect(element.shadowRoot!.textContent).toBe('open');

		// The attribute path keeps working alongside it.
		element.open = false;
		await flush();
		element.setAttribute('open', '');
		await flush();
		expect(element.shadowRoot!.textContent).toBe('open');
		element.remove();
	});

	it('warns in dev about a pre-upgrade binding to a property the component does not declare', () => {
		setDevMode(true);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const tag = nextTag('unknown-prop');
		class Host {
			public label?: string;
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.label}</p>` })(Host as never);

		presetBeforeUpgrade({ label: 'L' });
		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);

		expect(warn.mock.calls.some((call) => String(call[1]).includes('declares no "label" property'))).toBe(true);
		element.remove();
	});

	it('leaves ordinary data properties exactly as they were', async () => {
		const tag = nextTag('data-prop');
		class Host {
			public label = 'a';
		}
		MelodicComponent({ selector: tag, template: (c: Host) => html`<p>${c.label}</p>` })(Host as never);
		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);

		expect(Object.prototype.hasOwnProperty.call(element, 'label')).toBe(true);
		element.label = 'b';
		await flush();
		expect(element.shadowRoot!.textContent).toBe('b');
		element.remove();
	});
});

describe('review 2026-11 — css is text, not markup', () => {
	it('does not decode entities or strip tag-like text in component styles', () => {
		const styles = () => css`
			.a::after {
				content: '&lt;b&gt; &amp; <i>x</i>';
			}
			.b > .c {
				color: ${'red'};
			}
		`;
		const text = getComponentStyleText(styles);

		expect(text).toContain("content: '&lt;b&gt; &amp; <i>x</i>';");
		expect(text).toContain('color: red;');
		expect(getComponentStyleSheet(styles)).not.toBeNull();
	});

	it('composes nested css results, arrays and empty values', () => {
		const base = css`
			.base {
				margin: 0;
			}
		`;
		const styles = () => css`
			${base}
			${[
				css`
					.one {
						top: 1px;
					}
				`,
				css`
					.two {
						top: 2px;
					}
				`
			]}
			.three {
				top: ${3}px;
				left: ${undefined}${null}0;
			}
		`;
		const text = Array.from(getComponentStyleSheet(styles)!.cssRules)
			.map((rule) => rule.cssText)
			.join('\n');

		for (const expected of ['.base', '.one', '.two', '.three', '3px']) {
			expect(text).toContain(expected);
		}
		expect(text).not.toContain('undefined');
		expect(text).not.toContain('null');
	});

	it('still works as a template result', () => {
		const host = document.createElement('style');
		render(css`
			p {
				color: ${'blue'};
			}
		`, host);
		expect(host.textContent).toContain('blue');
	});

	it('styles written with html keep working', () => {
		const styles = () => html`
			p {
				color: green;
			}
		`;
		const text = Array.from(getComponentStyleSheet(styles)!.cssRules)
			.map((rule) => rule.cssText)
			.join('\n');
		expect(text).toContain('green');
	});
});

describe('review 2026-11 — moving a component to another document', () => {
	it('re-applies its styles when adopted', async () => {
		const tag = nextTag('adopt');
		class Host {
			public value = 1;
		}
		MelodicComponent({
			selector: tag,
			template: (c: Host) => html`<p>${c.value}</p>`,
			styles: () => css`
				p {
					color: rgb(1, 2, 3);
				}
			`
		})(Host as never);

		const element = document.createElement(tag) as AnyElement;
		document.body.appendChild(element);
		await flush();
		expect(typeof element.adoptedCallback).toBe('function');

		// What the platform does on adoption: the sheets are dropped. A document
		// without a window cannot construct sheets, which exercises the fallback.
		const foreign = document.implementation.createHTMLDocument('other');
		element.remove();
		element.shadowRoot!.adoptedStyleSheets = [];
		Object.defineProperty(element, 'ownerDocument', { value: foreign, configurable: true });
		element.adoptedCallback();

		const fallback = element.shadowRoot!.querySelector('style');
		expect(fallback).not.toBeNull();
		expect(fallback!.textContent).toContain('rgb(1, 2, 3)');

		// And the fallback survives a re-render.
		element.component.value = 2;
		element.requestRender();
		expect(element.shadowRoot!.querySelector('style')).not.toBeNull();

		// Coming home restores the shared sheets and drops the fallback.
		delete element.ownerDocument;
		element.adoptedCallback();
		expect(element.shadowRoot!.querySelector('style')).toBeNull();
		expect(element.shadowRoot!.adoptedStyleSheets.length).toBeGreaterThan(0);
	});
});
