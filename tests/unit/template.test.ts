import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from '../../src/template';
import { classMap } from '../../src/template/directives/builtin/class-map.directive';
import { when } from '../../src/template/directives/builtin/when.directive';


describe('template rendering', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	it('renders and updates text nodes', () => {
		const name = 'Alice';
		render(html`<span>${name}</span>`, container);
		expect(container.textContent).toBe('Alice');

		render(html`<span>${'Bob'}</span>`, container);
		expect(container.textContent).toBe('Bob');
	});

	it('supports classMap directives', () => {
		render(
			html`<div class=${classMap({ active: true, disabled: false })}></div>`,
			container
		);

		const el = container.querySelector('div');
		expect(el?.classList.contains('active')).toBe(true);
		expect(el?.classList.contains('disabled')).toBe(false);

		render(
			html`<div class=${classMap({ active: false, disabled: true })}></div>`,
			container
		);
		expect(el?.classList.contains('active')).toBe(false);
		expect(el?.classList.contains('disabled')).toBe(true);
	});

	it('supports when directives', () => {
		render(html`<div>${when(true, () => html`<span>yes</span>`)}</div>`, container);
		expect(container.textContent).toContain('yes');

		render(html`<div>${when(false, () => html`<span>no</span>`)}</div>`, container);
		expect(container.textContent).not.toContain('no');

		render(html`<div>${when(true, () => html`<span>back</span>`)}</div>`, container);
		expect(container.textContent).toContain('back');
	});
});
