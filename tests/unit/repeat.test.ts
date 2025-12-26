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

	it('reorders keyed items without losing content', () => {
		const items = [
			{ id: 1, label: 'One' },
			{ id: 2, label: 'Two' },
			{ id: 3, label: 'Three' }
		];

		render(
			html`<ul>${repeat(items, (item) => item.id, (item) => html`<li>${item.label}</li>`)}</ul>`,
			container
		);
		expect(container.textContent).toContain('One');
		expect(container.textContent).toContain('Two');
		expect(container.textContent).toContain('Three');

		const reordered = [items[2], items[1], items[0]];
		render(
			html`<ul>${repeat(reordered, (item) => item.id, (item) => html`<li>${item.label}</li>`)}</ul>`,
			container
		);

		const labels = Array.from(container.querySelectorAll('li')).map((li) => li.textContent?.trim());
		expect(labels).toEqual(['Three', 'Two', 'One']);
	});
});
