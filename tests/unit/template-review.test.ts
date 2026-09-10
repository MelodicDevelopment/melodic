import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { html, render, classMap, live } from '../../src/template';
import { signal } from '../../src/signals';
import { registerAdapter, clearAdapters } from '../../src/forms/adapters/adapter-registry';
import '../../src/forms/directives/model.directive';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';

let container: HTMLElement;

beforeEach(() => {
	container = document.createElement('div');
	document.body.appendChild(container);
});

afterEach(() => {
	container.remove();
	setDevMode(null);
	resetDevWarnings();
});

/** R5 — text that merely looked like an attribute leaked a marker. */
describe('text that looks like an attribute', () => {
	it('renders a binding after `word=` as text', () => {
		render(html`<p>Total=${42}</p>`, container);
		expect(container.textContent).toBe('Total=42');
		expect(container.innerHTML).not.toMatch(/__m/);
	});

	it('updates it like any other text binding', () => {
		const template = (n: number) => html`<p>Total=${n}</p>`;
		render(template(1), container);
		render(template(2), container);
		expect(container.textContent).toBe('Total=2');
	});

	it('still treats a real attribute as an attribute', () => {
		render(html`<p title=${'hint'}>x</p>`, container);
		expect(container.querySelector('p')!.getAttribute('title')).toBe('hint');
	});

	it('is not confused by a `>` inside a quoted attribute value', () => {
		render(html`<p title="a > b">Total=${7}</p>`, container);
		expect(container.querySelector('p')!.getAttribute('title')).toBe('a > b');
		expect(container.textContent).toBe('Total=7');
	});
});

/** R6 — a quoted special binding emitted a stray `"` attribute. */
describe('quoted special bindings', () => {
	it('does not leave a stray quote attribute for @event', () => {
		const handler = vi.fn();
		render(html`<button @click="${handler}">go</button>`, container);

		const button = container.querySelector('button')!;
		expect(button.getAttributeNames()).not.toContain('"');
		button.click();
		expect(handler).toHaveBeenCalled();
	});

	it('does not leave a stray quote attribute for .property', () => {
		render(html`<input .value="${'hello'}" />`, container);

		const input = container.querySelector('input')!;
		expect(input.getAttributeNames()).not.toContain('"');
		expect(input.value).toBe('hello');
	});

	it('does not leave a stray quote attribute for ?boolean', () => {
		render(html`<input ?disabled="${true}" />`, container);

		const input = container.querySelector('input')!;
		expect(input.getAttributeNames()).not.toContain('"');
		expect(input.disabled).toBe(true);
	});
});

/** R7 — a directive in a composite attribute dropped the other segments. */
describe('directives inside a composite attribute', () => {
	it('keeps the static segments', () => {
		render(html`<div class="card ${classMap({ active: true })}"></div>`, container);

		const div = container.querySelector('div')!;
		expect(div.classList.contains('card')).toBe(true);
		expect(div.classList.contains('active')).toBe(true);
	});

	it('updates the directive without losing the static segments', () => {
		const template = (active: boolean) => html`<div class="card ${classMap({ active })}"></div>`;

		render(template(true), container);
		render(template(false), container);

		const div = container.querySelector('div')!;
		expect(div.classList.contains('card')).toBe(true);
		expect(div.classList.contains('active')).toBe(false);
	});

	it('combines a plain segment, a directive and static text', () => {
		const template = (size: string, active: boolean) => html`<div class="card ${size} ${classMap({ active })} tail"></div>`;

		render(template('lg', true), container);
		const div = container.querySelector('div')!;

		expect(div.classList.contains('card')).toBe(true);
		expect(div.classList.contains('lg')).toBe(true);
		expect(div.classList.contains('tail')).toBe(true);
		expect(div.classList.contains('active')).toBe(true);

		render(template('sm', false), container);
		expect(div.classList.contains('sm')).toBe(true);
		expect(div.classList.contains('lg')).toBe(false);
		expect(div.classList.contains('active')).toBe(false);
	});
});

/** R16 — a property binding could not reset a user-edited field. */
describe('live()', () => {
	it('rewrites a user-edited value back to the bound value', () => {
		const template = (value: string) => html`<input .value=${live(value)} />`;

		render(template('draft'), container);
		const input = container.querySelector('input')!;
		expect(input.value).toBe('draft');

		// The user types; the model is unchanged.
		input.value = 'typed by the user';

		render(template('draft'), container);
		expect(input.value).toBe('draft');
	});

	it('a plain property binding does NOT (which is why live exists)', () => {
		const template = (value: string) => html`<input .value=${value} />`;

		render(template('draft'), container);
		const input = container.querySelector('input')!;
		input.value = 'typed by the user';

		render(template('draft'), container);
		expect(input.value).toBe('typed by the user');
	});

	it('binds checked as readily as value', () => {
		const template = (checked: boolean) => html`<input type="checkbox" .checked=${live(checked)} />`;

		render(template(true), container);
		const input = container.querySelector('input')!;
		input.checked = false;

		render(template(true), container);
		expect(input.checked).toBe(true);
	});
});

/** D13 — two-way binding used to be .value + @input + a casting handler. */
describe(':model', () => {
	beforeEach(() => {
		registerAdapter((element) => element.tagName === 'INPUT', {
			inputEvent: 'input',
			blurEvent: 'blur',
			getValue: (element) => (element as HTMLInputElement).value,
			setValue: (element, value) => {
				(element as HTMLInputElement).value = value === null || value === undefined ? '' : String(value);
			}
		});
	});

	afterEach(() => {
		clearAdapters();
	});

	it('pushes the signal into the element and back', () => {
		const query = signal('start');
		render(html`<input :model=${query} />`, container);

		const input = container.querySelector('input')!;
		expect(input.value).toBe('start');

		query.set('from the model');
		expect(input.value).toBe('from the model');

		input.value = 'from the user';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		expect(query()).toBe('from the user');
	});

	it('warns when given something other than a signal', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		render(html`<input :model=${'not a signal'} />`, container);

		expect(warn.mock.calls.some((call) => String(call[1]).includes('expects a signal'))).toBe(true);
		warn.mockRestore();
	});
});

/** R8 — duplicate keys orphaned DOM and part trees. */
describe('duplicate keys', () => {
	it('renders one node per entry and warns in dev', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		setDevMode(true);

		const template = (keys: string[]) =>
			html`<ul>
				${keys.map((key) => ({ __keyed: true, key, value: html`<li>${key}</li>` }))}
			</ul>`;

		render(template(['a', 'a', 'b']), container);
		expect(container.querySelectorAll('li').length).toBe(3);
		expect(warn.mock.calls.some((call) => String(call[1]).includes('duplicate key'))).toBe(true);

		// Shrinking must not leave the shadowed entry behind.
		render(template(['a']), container);
		expect(container.querySelectorAll('li').length).toBe(1);

		warn.mockRestore();
	});
});
