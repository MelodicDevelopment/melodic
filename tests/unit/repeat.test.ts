import { describe, it, expect, beforeEach } from 'vitest';
import { html, render } from '../../src/template';
import { repeat } from '../../src/template/directives/builtin/repeat.directive';


describe('repeat directive', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
	});

	it('renders list items and clears removed entries', () => {
		const items = [
			{ id: 1, label: 'A' },
			{ id: 2, label: 'B' }
		];

		render(
			html`<ul>${repeat(items, (item) => item.id, (item) => html`<li>${item.label}</li>`)}</ul>`,
			container
		);
		expect(container.querySelectorAll('li').length).toBe(2);

		render(
			html`<ul>${repeat([items[0]], (item) => item.id, (item) => html`<li>${item.label}</li>`)}</ul>`,
			container
		);
		expect(container.querySelectorAll('li').length).toBe(1);
		expect(container.textContent).toContain('A');
		expect(container.textContent).not.toContain('B');
	});
});
