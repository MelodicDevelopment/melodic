import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { html, render } from '../../src/template';
import { registerAttributeDirective, unregisterAttributeDirective } from '../../src/template/directives/functions/attribute-directive.functions';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('template attributes', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	afterEach(() => {
		unregisterAttributeDirective('test');
	});

	it('handles composite attributes', () => {
		let name = 'Ada';

		render(html`<div title="Hello ${name}!"></div>`, container);
		const first = container.querySelector('div');
		expect(first?.getAttribute('title')).toBe('Hello Ada!');

		name = 'Bob';
		render(html`<div title="Hello ${name}!"></div>`, container);
		const second = container.querySelector('div');
		expect(second?.getAttribute('title')).toBe('Hello Bob!');
	});

	it('applies composite attributes in a component shadow template on initial render and re-render', async () => {
		class CompositeAttrComponent {
			flag = false;
		}

		MelodicComponent({
			selector: 'test-composite-attr-component',
			template: (component: CompositeAttrComponent) => html`
				<span ?hidden=${!component.flag}>sibling</span>
				<div class="inner ${component.flag ? 'on' : ''}">content</div>
			`
		})(CompositeAttrComponent);

		const element = document.createElement('test-composite-attr-component') as any;
		document.body.appendChild(element);

		const div = element.shadowRoot?.querySelector('div');
		const span = element.shadowRoot?.querySelector('span');

		// Initial render: static prefix AND dynamic segment are both applied
		expect(div?.getAttribute('class')).toBe('inner ');
		expect(span?.hasAttribute('hidden')).toBe(true);

		// Re-render: the dynamic segment updates alongside sibling bindings
		element.flag = true;
		await flushMicrotasks();
		expect(div?.getAttribute('class')).toBe('inner on');
		expect(span?.hasAttribute('hidden')).toBe(false);

		// And back again
		element.flag = false;
		await flushMicrotasks();
		expect(div?.getAttribute('class')).toBe('inner ');
		expect(span?.hasAttribute('hidden')).toBe(true);

		document.body.removeChild(element);
	});

	it('skips the DOM write for unchanged composite attributes on every re-render', () => {
		const template = (name: string) => html`<div title="Hello ${name}!"></div>`;

		render(template('Ada'), container);
		const el = container.querySelector('div') as HTMLElement;
		const setAttributeSpy = vi.spyOn(el, 'setAttribute');

		// Unchanged re-renders must never touch the attribute — the skip must
		// keep working across MULTIPLE renders (previousValue must not be
		// corrupted by the unchanged fast-path).
		render(template('Ada'), container);
		render(template('Ada'), container);
		expect(setAttributeSpy).not.toHaveBeenCalled();

		render(template('Bob'), container);
		expect(setAttributeSpy).toHaveBeenCalledTimes(1);
		expect(el.getAttribute('title')).toBe('Hello Bob!');

		// And the skip re-arms after a change.
		setAttributeSpy.mockClear();
		render(template('Bob'), container);
		expect(setAttributeSpy).not.toHaveBeenCalled();

		setAttributeSpy.mockRestore();
	});

	it('applies and removes boolean attributes', () => {
		render(html`<button disabled=${true}>Click</button>`, container);
		const button = container.querySelector('button');
		expect(button?.hasAttribute('disabled')).toBe(true);

		render(html`<button disabled=${false}>Click</button>`, container);
		expect(button?.hasAttribute('disabled')).toBe(false);
	});

	it('renders ARIA boolean attributes as the literal strings "true"/"false"', () => {
		render(html`<div role="button" aria-expanded=${true} aria-disabled=${false}></div>`, container);
		const el = container.querySelector('div');
		// ARIA state attributes never use present/absent semantics.
		expect(el?.getAttribute('aria-expanded')).toBe('true');
		expect(el?.getAttribute('aria-disabled')).toBe('false');

		render(html`<div role="button" aria-expanded=${false} aria-disabled=${true}></div>`, container);
		const updated = container.querySelector('div');
		expect(updated?.getAttribute('aria-expanded')).toBe('false');
		expect(updated?.getAttribute('aria-disabled')).toBe('true');
	});

	it('runs action directives and cleans up on updates', () => {
		let calls = 0;
		let cleanups = 0;

		registerAttributeDirective('test', (element, value) => {
			calls += 1;
			element.setAttribute('data-test', String(value));
			return () => {
				cleanups += 1;
				element.removeAttribute('data-test');
			};
		});

		render(html`<div :test=${'one'}></div>`, container);
		const element = container.querySelector('div');
		expect(calls).toBe(1);
		expect(element?.getAttribute('data-test')).toBe('one');

		render(html`<div :test=${'two'}></div>`, container);
		expect(calls).toBe(2);
		expect(cleanups).toBe(1);
		expect(element?.getAttribute('data-test')).toBe('two');
	});

	it('executes static action directives once (case-insensitive lookup)', () => {
		let calls = 0;

		registerAttributeDirective('MyAction', (element, value) => {
			calls += 1;
			element.setAttribute('data-action', String(value));
		});

		render(html`<div :myaction="static"></div>`, container);
		const element = container.querySelector('div');
		expect(calls).toBe(1);
		expect(element?.getAttribute('data-action')).toBe('static');

		render(html`<div :myaction="static"></div>`, container);
		expect(calls).toBe(1);
	});

	it('cleans up action directives when template changes', () => {
		let cleanups = 0;

		registerAttributeDirective('cleanupSwitch', () => {
			return () => {
				cleanups += 1;
			};
		});

		render(html`<div :cleanupSwitch=${'one'}></div>`, container);
		render(html`<span>Next</span>`, container);

		expect(cleanups).toBe(1);
	});
});

describe('attribute values containing quote characters', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	// The parser tracks the opening quote of an attribute so it knows a binding
	// sits in attribute position. Matching both quote styles at once used to make
	// a value containing the other quote fall through to the text-position branch,
	// which injected a comment marker into the attribute value — it leaked into
	// the DOM as literal text and the binding never updated.
	it('binds inside a double-quoted value that contains an apostrophe', () => {
		render(html`<div title="it's ${'bound'}">hi</div>`, container);
		expect(container.firstElementChild?.getAttribute('title')).toBe("it's bound");
	});

	it('binds inside a single-quoted value that contains a double quote', () => {
		render(html`<div title='say "${'bound'}"'>hi</div>`, container);
		expect(container.firstElementChild?.getAttribute('title')).toBe('say "bound"');
	});

	it('leaves no internal marker in the rendered attribute', () => {
		render(html`<div title="don't ${'x'}">hi</div>`, container);
		expect(container.innerHTML).not.toContain('<!--');
	});

	it('updates a quote-containing attribute across renders', () => {
		const view = (value: string) => html`<div title="it's ${value}">hi</div>`;
		render(view('first'), container);
		render(view('second'), container);
		expect(container.firstElementChild?.getAttribute('title')).toBe("it's second");
	});

	it('still treats an apostrophe in text content as text', () => {
		render(html`<p>don't ${'bound'}</p>`, container);
		expect(container.textContent).toBe("don't bound");
	});
});
