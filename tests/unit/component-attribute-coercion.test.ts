import { describe, it, expect } from 'vitest';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';
import { html } from '../../src/template';

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => queueMicrotask(resolve));
}

describe('attribute → property coercion', () => {
	it('coerces numeric attributes for number-initialized properties', async () => {
		class NumberCoercionComponent {
			offset = 8;
			ratio = 0.5;
		}

		MelodicComponent({
			selector: 'test-number-coercion',
			template: (c: NumberCoercionComponent) => html`<span>${c.offset}</span>`,
			attributes: ['offset', 'ratio']
		})(NumberCoercionComponent);

		const element = document.createElement('test-number-coercion');
		document.body.appendChild(element);
		await flushMicrotasks();

		element.setAttribute('offset', '12');
		element.setAttribute('ratio', '0.75');
		await flushMicrotasks();

		const component = (element as unknown as { component: NumberCoercionComponent }).component;
		expect(component.offset).toBe(12);
		expect(component.ratio).toBe(0.75);

		// Non-numeric garbage is passed through instead of becoming NaN.
		element.setAttribute('offset', 'abc');
		await flushMicrotasks();
		expect(component.offset).toBe('abc' as unknown as number);

		document.body.removeChild(element);
		await flushMicrotasks();
	});

	it('coerces boolean attributes, including for initially-undefined props via canonical literals', async () => {
		class BooleanCoercionComponent {
			disabled = false;
			open?: boolean; // no initializer — no runtime type information
		}

		MelodicComponent({
			selector: 'test-boolean-coercion',
			template: (c: BooleanCoercionComponent) => html`<span>${String(c.disabled)}</span>`,
			attributes: ['disabled', 'open']
		})(BooleanCoercionComponent);

		const element = document.createElement('test-boolean-coercion');
		document.body.appendChild(element);
		await flushMicrotasks();

		const component = (element as unknown as { component: BooleanCoercionComponent }).component;

		element.setAttribute('disabled', '');
		await flushMicrotasks();
		expect(component.disabled).toBe(true);

		element.setAttribute('disabled', 'false');
		await flushMicrotasks();
		expect(component.disabled).toBe(false);

		element.removeAttribute('disabled');
		await flushMicrotasks();
		expect(component.disabled).toBe(false);

		// `open` has no type info: the canonical literal "false" must not become
		// a truthy string (the old bug), and "true" must become boolean true.
		element.setAttribute('open', 'false');
		await flushMicrotasks();
		expect(component.open).toBe(false);

		element.setAttribute('open', 'true');
		await flushMicrotasks();
		expect(component.open).toBe(true);

		// With a current boolean value, standard boolean semantics apply ("" = present = true).
		element.setAttribute('open', '');
		await flushMicrotasks();
		expect(component.open).toBe(true);

		document.body.removeChild(element);
		await flushMicrotasks();
	});

	it('honors explicit static propertyTypes declarations', async () => {
		class DeclaredTypesComponent {
			public static propertyTypes = {
				open: 'boolean',
				size: 'number',
				code: 'string'
			} as const;

			open?: boolean;
			size?: number;
			code = 42; // declared string wins over the number initializer
		}

		MelodicComponent({
			selector: 'test-declared-types',
			template: () => html`<span></span>`,
			attributes: ['open', 'size', 'code']
		})(DeclaredTypesComponent);

		const element = document.createElement('test-declared-types');
		document.body.appendChild(element);
		await flushMicrotasks();

		const component = (element as unknown as { component: DeclaredTypesComponent }).component;

		// Boolean-declared, initially undefined: presence semantics work.
		element.setAttribute('open', '');
		await flushMicrotasks();
		expect(component.open).toBe(true);

		element.setAttribute('size', '10');
		await flushMicrotasks();
		expect(component.size).toBe(10);

		// Declared string: numeric-looking values are NOT coerced.
		element.setAttribute('code', '007');
		await flushMicrotasks();
		expect(component.code).toBe('007' as unknown as number);

		document.body.removeChild(element);
		await flushMicrotasks();
	});

	it('assigns attribute values to initially-undefined properties (reflection no longer drops them)', async () => {
		class UndefinedPropComponent {
			label?: string;
		}

		MelodicComponent({
			selector: 'test-undefined-prop',
			template: (c: UndefinedPropComponent) => html`<span>${c.label ?? ''}</span>`,
			attributes: ['label']
		})(UndefinedPropComponent);

		const element = document.createElement('test-undefined-prop');
		document.body.appendChild(element);
		await flushMicrotasks();

		element.setAttribute('label', 'hello');
		await flushMicrotasks();

		const component = (element as unknown as { component: UndefinedPropComponent }).component;
		expect(component.label).toBe('hello');
		expect(element.shadowRoot?.textContent).toContain('hello');

		document.body.removeChild(element);
		await flushMicrotasks();
	});

	it('skips re-render when the reflected value is Object.is-equal', async () => {
		let renders = 0;

		class RenderSkipComponent {
			count = 1;

			onRender(): void {
				renders += 1;
			}
		}

		MelodicComponent({
			selector: 'test-render-skip',
			template: (c: RenderSkipComponent) => html`<span>${c.count}</span>`,
			attributes: ['count']
		})(RenderSkipComponent);

		const element = document.createElement('test-render-skip');
		document.body.appendChild(element);
		await flushMicrotasks();
		expect(renders).toBe(1);

		// Attribute reflects to the SAME value — no render.
		element.setAttribute('count', '1');
		await flushMicrotasks();
		expect(renders).toBe(1);

		// A real change renders once.
		element.setAttribute('count', '2');
		await flushMicrotasks();
		expect(renders).toBe(2);
		expect(element.shadowRoot?.textContent).toContain('2');

		document.body.removeChild(element);
		await flushMicrotasks();
	});
});
