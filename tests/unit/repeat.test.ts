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

	it('rebuilds an item in the live DOM when its template structure changes', () => {
		const container = document.createElement('div');
		type Row = { id: number; label: string; editing: boolean };
		const tpl = (rows: Row[]) =>
			html`<ul>${repeat(rows, (r) => r.id, (r) => (r.editing ? html`<input value=${r.label} />` : html`<li>${r.label}</li>`))}</ul>`;

		render(tpl([{ id: 1, label: 'A', editing: false }]), container);
		expect(container.querySelector('li')?.textContent?.trim()).toBe('A');
		expect(container.querySelector('input')).toBeNull();

		// Same key, DIFFERENT template structure — the live nodes must be
		// replaced, not left stale while the new structure renders into the
		// item's detached fragment.
		render(tpl([{ id: 1, label: 'A', editing: true }]), container);
		expect(container.querySelector('li')).toBeNull();
		const input = container.querySelector('input');
		expect(input?.getAttribute('value')).toBe('A');

		// And back again, with updated content.
		render(tpl([{ id: 1, label: 'A2', editing: false }]), container);
		expect(container.querySelector('input')).toBeNull();
		expect(container.querySelector('li')?.textContent?.trim()).toBe('A2');
	});
});
