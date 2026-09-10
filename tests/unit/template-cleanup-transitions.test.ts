import { describe, it, expect, vi } from 'vitest';
import { html, render, repeat, when, directive } from '../../src/template';
import { repeatRaw } from '../../src/template/directives/builtin/repeat-raw.directive';

/**
 * Regressions from the September 2026 review: content transitions must
 * dispose and remove what they replace, and list directives must work at a
 * template root (markers still inside the template's DocumentFragment).
 */
describe('template content transitions', () => {
	it('repeatRaw removes the element a factory replaces during list growth', () => {
		const container = document.createElement('div');
		const view = (items: number[]) =>
			html`<div>${repeatRaw(items, (x) => x, (x) => {
				const el = document.createElement('b');
				el.textContent = String(x);
				return el;
			})}</div>`;

		render(view([1]), container);
		render(view([1, 2]), container);
		expect(container.textContent).toBe('12');

		render(view([2, 1]), container);
		expect(container.textContent).toBe('21');
		expect(container.querySelectorAll('b').length).toBe(2);
	});

	it('repeatRaw keeps element identity when an update callback is provided', () => {
		const container = document.createElement('div');
		const factory = vi.fn((x: { id: number; text: string }) => {
			const el = document.createElement('b');
			el.textContent = x.text;
			return el;
		});
		const view = (items: Array<{ id: number; text: string }>) =>
			html`<div>${repeatRaw(items, (x) => x.id, factory, (el, x) => { el.textContent = x.text; })}</div>`;

		render(view([{ id: 1, text: 'a' }]), container);
		const first = container.querySelector('b');
		render(view([{ id: 2, text: 'c' }, { id: 1, text: 'b' }]), container);

		expect(container.textContent).toBe('cb');
		expect(container.querySelectorAll('b')[1]).toBe(first);
		expect(factory).toHaveBeenCalledTimes(2);
	});

	it('repeat works at the root of a template', () => {
		const container = document.createElement('div');
		const view = (items: number[]) => html`${repeat(items, (x) => x, (x) => html`<span>${x}</span>`)}`;

		expect(() => render(view([1, 2]), container)).not.toThrow();
		expect(container.textContent).toBe('12');
		render(view([2, 3, 1]), container);
		expect(container.textContent).toBe('231');
	});

	it('repeatRaw works at the root of a template', () => {
		const container = document.createElement('div');
		const view = (items: number[]) =>
			html`${repeatRaw(items, (x) => x, (x) => { const el = document.createElement('i'); el.textContent = String(x); return el; })}`;

		render(view([1]), container);
		render(view([2, 1]), container);
		expect(container.textContent).toBe('21');
	});

	it('repeat releases its creation-time node snapshot after insertion', () => {
		const parent = document.createElement('div');
		const marker = document.createTextNode('');
		parent.append(marker);
		const original = { id: 1, text: 'old' };

		const state = repeat([original], (x) => x.id, (x) => html`<b>${x.text}</b>`).render(marker) as any;
		expect(state.items[0].nodes).toEqual([]);
		expect('value' in state.items[0]).toBe(false);

		repeat([{ id: 1, text: 'new' }], (x) => x.id, (x) => html`<i>${x.text}</i>`).render(marker, state);
		expect(parent.textContent).toBe('new');
		expect(parent.querySelector('b')).toBeNull();
	});

	it('switching a nested template to keyed values clears the prior content', () => {
		const container = document.createElement('div');
		const view = (v: unknown) => html`<div>${v}</div>`;

		render(view(html`<b>old</b>`), container);
		render(view([{ __keyed: true, key: 1, value: html`<i>new</i>` }]), container);
		expect(container.textContent).toBe('new');
		expect(container.querySelector('b')).toBeNull();
	});

	it('switching a bare node to keyed values clears the prior content', () => {
		const container = document.createElement('div');
		const view = (v: unknown) => html`<div>${v}</div>`;
		const node = document.createElement('b');
		node.textContent = 'old';

		render(view(node), container);
		render(view([{ __keyed: true, key: 1, value: html`<i>new</i>` }]), container);
		expect(container.textContent).toBe('new');
	});

	it('runs attribute directive cleanup when switching to a plain value', () => {
		const cleanup = vi.fn();
		const active = directive(() => ({ __dispose: cleanup }), 'cleanup-attribute');
		const view = (value: unknown) => html`<div title=${value}></div>`;
		const container = document.createElement('div');

		render(view(active), container);
		render(view('plain'), container);

		expect(cleanup).toHaveBeenCalledTimes(1);
		expect(container.querySelector('div')?.getAttribute('title')).toBe('plain');
	});

	it('runs property directive cleanup when switching to a plain value', () => {
		const cleanup = vi.fn();
		const active = directive(() => ({ __dispose: cleanup }), 'cleanup-property');
		const view = (value: unknown) => html`<input .value=${value} />`;
		const container = document.createElement('div');

		render(view(active), container);
		render(view('plain'), container);

		expect(cleanup).toHaveBeenCalledTimes(1);
		expect((container.querySelector('input') as HTMLInputElement).value).toBe('plain');
	});

	it('removing the false branch of when() while still false clears its DOM', () => {
		const container = document.createElement('div');
		const view = (fallback?: () => any) => html`<div>${when(false, () => html`yes`, fallback)}</div>`;

		render(view(() => html`fallback`), container);
		expect(container.textContent).toBe('fallback');
		render(view(), container);
		expect(container.textContent).toBe('');
		render(view(() => html`again`), container);
		expect(container.textContent).toBe('again');
	});
});
