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

	it('updates item content in place when keys and order are unchanged', () => {
		const render1 = [
			{ id: 1, label: 'A' },
			{ id: 2, label: 'B' }
		];

		render(
			html`<ul>${repeat(render1, (item) => item.id, (item) => html`<li>${item.label}</li>`)}</ul>`,
			container
		);
		expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent?.trim())).toEqual(['A', 'B']);

		// Same keys, same order, changed content — must reflect in the live DOM.
		const render2 = [
			{ id: 1, label: 'A-updated' },
			{ id: 2, label: 'B-updated' }
		];
		render(
			html`<ul>${repeat(render2, (item) => item.id, (item) => html`<li>${item.label}</li>`)}</ul>`,
			container
		);
		expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent?.trim())).toEqual([
			'A-updated',
			'B-updated'
		]);
	});
});
