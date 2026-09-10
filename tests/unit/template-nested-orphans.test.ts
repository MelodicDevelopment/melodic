import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { html, render } from '../../src/template';
import { when } from '../../src/template/directives/builtin/when.directive';
import { repeat } from '../../src/template/directives/builtin/repeat.directive';
import { registerAttributeDirective, unregisterAttributeDirective } from '../../src/template/directives/functions/attribute-directive.functions';

/**
 * A parent that renders nested content used to snapshot the nodes it inserted
 * and, on teardown, remove only that snapshot. A nested node part inside that
 * content swapping its own template detached nodes from the snapshot and
 * inserted new ones that were not in it — so the parent's teardown left them
 * stranded between its markers, and the next render put a second copy beside
 * the orphan.
 *
 * Teardown now clears the live range between the owning markers, so nothing a
 * child part inserted can outlive its parent.
 */
describe('nested content teardown clears the live marker range', () => {
	let container: HTMLElement;
	let cleanups: number;
	let setups: number;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
		cleanups = 0;
		setups = 0;
		registerAttributeDirective('track', () => {
			setups += 1;
			return () => {
				cleanups += 1;
			};
		});
	});

	afterEach(() => {
		container.remove();
		unregisterAttributeDirective('track');
	});

	describe('nested TemplateResult in a node part', () => {
		const view = (outer: boolean, inner: boolean) => html`
			<section>
				${outer
					? html`
							<div class="a">A</div>
							${inner ? html`<div class="x" :track=${1}>X</div>` : html`<div class="y" :track=${1}>Y</div>`}
						`
					: ''}
			</section>
		`;

		it('does not duplicate a block after an inner swap, parent teardown and remount', () => {
			render(view(true, false), container);
			expect(container.querySelectorAll('.a').length).toBe(1);
			expect(container.querySelectorAll('.y').length).toBe(1);

			render(view(true, true), container);
			expect(container.querySelectorAll('.y').length).toBe(0);
			expect(container.querySelectorAll('.x').length).toBe(1);

			render(view(false, true), container);
			expect(container.querySelectorAll('.a').length).toBe(0);
			expect(container.querySelectorAll('.x').length).toBe(0);
			expect(container.querySelector('section')!.querySelectorAll('div').length).toBe(0);

			render(view(true, true), container);
			expect(container.querySelectorAll('.a').length).toBe(1);
			expect(container.querySelectorAll('.x').length).toBe(1);
		});

		it('runs each cleanup exactly once across the sequence', () => {
			render(view(true, false), container); // Y set up
			render(view(true, true), container); // Y cleaned, X set up
			render(view(false, true), container); // X cleaned
			expect(setups).toBe(2);
			expect(cleanups).toBe(2);

			render(view(true, true), container); // fresh X
			expect(setups).toBe(3);
			expect(cleanups).toBe(2);

			render(view(false, false), container);
			expect(cleanups).toBe(3);
		});

		it('clears a nested part that started as text and later rendered a template', () => {
			const view2 = (outer: boolean, inner: unknown) => html`<section>${outer ? html`<div class="a">A</div>${inner}` : ''}</section>`;

			render(view2(true, 'plain'), container);
			render(view2(true, html`<div class="x">X</div>`), container);
			expect(container.querySelectorAll('.x').length).toBe(1);

			render(view2(false, null), container);
			expect(container.querySelector('section')!.querySelectorAll('div').length).toBe(0);

			render(view2(true, html`<div class="x">X</div>`), container);
			expect(container.querySelectorAll('.x').length).toBe(1);
			expect(container.querySelectorAll('.a').length).toBe(1);
		});

		it('handles three nested levels (the dialog shape)', () => {
			const view3 = (level1: boolean, level2: boolean, level3: boolean) => html`
				<div>
					${level1
						? html`
								<p class="l1">L1</p>
								${level2
									? html`
											<p class="l2">L2</p>
											${level3 ? html`<p class="l3-on">on</p>` : html`<p class="l3-off">off</p>`}
										`
									: html`<p class="l2-alt">alt</p>`}
							`
						: ''}
				</div>
			`;

			render(view3(true, true, false), container);
			render(view3(true, true, true), container);
			render(view3(true, false, true), container);
			render(view3(false, false, true), container);
			expect(container.querySelector('div')!.querySelectorAll('p').length).toBe(0);

			render(view3(true, true, true), container);
			expect(container.querySelectorAll('p').length).toBe(3);
			expect(container.querySelectorAll('.l1').length).toBe(1);
			expect(container.querySelectorAll('.l2').length).toBe(1);
			expect(container.querySelectorAll('.l3-on').length).toBe(1);
		});
	});

	describe('when() directive', () => {
		const view = (outer: boolean, inner: boolean) => html`
			<section>
				${when(
					outer,
					() => html`
						<div class="a">A</div>
						${inner ? html`<div class="x" :track=${1}>X</div>` : html`<div class="y" :track=${1}>Y</div>`}
					`
				)}
			</section>
		`;

		it('does not strand nodes swapped by a nested part inside the branch', () => {
			render(view(true, false), container);
			render(view(true, true), container);
			expect(container.querySelectorAll('.x').length).toBe(1);

			render(view(false, true), container);
			expect(container.querySelector('section')!.querySelectorAll('div').length).toBe(0);
			expect(cleanups).toBe(2);

			render(view(true, true), container);
			expect(container.querySelectorAll('.a').length).toBe(1);
			expect(container.querySelectorAll('.x').length).toBe(1);
			expect(setups).toBe(3);
		});
	});

	describe('array items', () => {
		const rowTemplate = (label: string, flag: boolean) => html`
			<div class="row">${label}</div>
			${flag ? html`<div class="x" :track=${1}>X</div>` : html`<div class="y" :track=${1}>Y</div>`}
		`;

		it('unkeyed: removes an item whose nested part swapped after it was created', () => {
			const view = (rows: Array<[string, boolean]>) => html`<section>${rows.map(([label, flag]) => rowTemplate(label, flag))}</section>`;

			render(
				view([
					['a', false],
					['b', false]
				]),
				container
			);
			render(
				view([
					['a', true],
					['b', true]
				]),
				container
			);
			expect(container.querySelectorAll('.x').length).toBe(2);

			// Shrink: the tail item must go away entirely, including the X its
			// nested part inserted after the item snapshot was taken.
			render(view([['a', true]]), container);
			expect(container.querySelectorAll('.row').length).toBe(1);
			expect(container.querySelectorAll('.x').length).toBe(1);
			expect(cleanups).toBe(3);

			// Switch the part to something else entirely: nothing may survive.
			render(view([]), container);
			render(html`<section>${'text'}</section>`, container);
			expect(container.querySelector('section')!.querySelectorAll('div').length).toBe(0);
		});

		it('unkeyed: rebuilds an item in place at its own index when its type changes', () => {
			const view = (rows: unknown[]) => html`<section>${rows}</section>`;

			render(view([rowTemplate('a', false), rowTemplate('b', false), rowTemplate('c', false)]), container);
			render(view([rowTemplate('a', true), rowTemplate('b', true), rowTemplate('c', true)]), container);

			// Middle item becomes a primitive: its live nodes (incl. the swapped X)
			// must be removed and the text must land between a and c.
			render(view([rowTemplate('a', true), 'middle', rowTemplate('c', true)]), container);
			const section = container.querySelector('section')!;
			expect(section.querySelectorAll('.x').length).toBe(2);
			expect(section.querySelectorAll('.row').length).toBe(2);
			const text = section.textContent!.replace(/\s+/g, ' ').trim();
			expect(text).toBe('a X middle c X');
		});

		it('keyed (plain array of keyed values): removal and reorder use the live item range', () => {
			const keyed = (key: string, value: unknown) => ({ __keyed: true, key, value });
			const view = (rows: Array<[string, boolean]>) => html`<section>${rows.map(([label, flag]) => keyed(label, rowTemplate(label, flag)))}</section>`;

			render(
				view([
					['a', false],
					['b', false],
					['c', false]
				]),
				container
			);
			render(
				view([
					['a', true],
					['b', true],
					['c', true]
				]),
				container
			);
			expect(container.querySelectorAll('.x').length).toBe(3);

			// Remove the middle key and reverse the rest.
			render(
				view([
					['c', true],
					['a', true]
				]),
				container
			);
			const section = container.querySelector('section')!;
			expect(section.querySelectorAll('.x').length).toBe(2);
			expect(Array.from(section.querySelectorAll('.row')).map((row) => row.textContent)).toEqual(['c', 'a']);
			expect(section.textContent!.replace(/\s+/g, ' ').trim()).toBe('c X a X');
			expect(cleanups).toBe(4);
		});

		it('keyed: a structure change inside an item replaces its whole live range', () => {
			const keyed = (key: string, value: unknown) => ({ __keyed: true, key, value });
			const alt = (label: string) => html`<span class="alt">${label}</span>`;
			const view = (rows: Array<[string, boolean, boolean]>) =>
				html`<section>${rows.map(([label, flag, useAlt]) => keyed(label, useAlt ? alt(label) : rowTemplate(label, flag)))}</section>`;

			render(view([['a', false, false]]), container);
			render(view([['a', true, false]]), container);
			expect(container.querySelectorAll('.x').length).toBe(1);

			// Same key, different template structure: the swapped-in X must go too.
			render(view([['a', true, true]]), container);
			const section = container.querySelector('section')!;
			expect(section.querySelectorAll('.x').length).toBe(0);
			expect(section.querySelectorAll('.row').length).toBe(0);
			expect(section.querySelectorAll('.alt').length).toBe(1);
			expect(cleanups).toBe(2);

			render(view([['a', true, false]]), container);
			expect(section.querySelectorAll('.alt').length).toBe(0);
			expect(section.querySelectorAll('.x').length).toBe(1);
		});

		it('repeat(): a structure change inside an item replaces its whole live range', () => {
			const alt = (label: string) => html`<span class="alt">${label}</span>`;
			const view = (rows: Array<[string, boolean, boolean]>) => html`<section>${repeat(
				rows,
				([label]) => label,
				([label, flag, useAlt]) => (useAlt ? alt(label) : rowTemplate(label, flag))
			)}</section>`;

			render(view([['a', false, false]]), container);
			render(view([['a', true, false]]), container);
			render(view([['a', true, true]]), container);
			const section = container.querySelector('section')!;
			expect(section.querySelectorAll('.x').length).toBe(0);
			expect(section.querySelectorAll('.alt').length).toBe(1);
			expect(section.textContent!.replace(/\s+/g, ' ').trim()).toBe('a');
			expect(cleanups).toBe(2);
		});

		it('repeat(): removal uses the live item range', () => {
			const view = (rows: Array<[string, boolean]>) => html`<section>${repeat(
				rows,
				([label]) => label,
				([label, flag]) => rowTemplate(label, flag)
			)}</section>`;

			render(
				view([
					['a', false],
					['b', false]
				]),
				container
			);
			render(
				view([
					['a', true],
					['b', true]
				]),
				container
			);
			render(view([['b', true]]), container);
			const section = container.querySelector('section')!;
			expect(section.querySelectorAll('.row').length).toBe(1);
			expect(section.querySelectorAll('.x').length).toBe(1);
			expect(section.textContent!.replace(/\s+/g, ' ').trim()).toBe('b X');
		});
	});
});
