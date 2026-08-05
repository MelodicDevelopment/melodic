import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { html, render } from '../../src/template';
import { repeat } from '../../src/template/directives/builtin/repeat.directive';
import { MelodicComponent } from '../../src/components/decorators/melodic-component.decorator';

/**
 * Unkeyed arrays — `${items.map(i => html`…`)}` — are reused positionally.
 *
 * Before that existed every re-render tore the list down and rebuilt it. The
 * DOM output was correct, so nothing failed loudly; what broke was node
 * identity, and identity is what the browser's click synthesis (mousedown and
 * mouseup on the SAME node), focus, selection and scroll state all hang off.
 */
describe('unkeyed array positional reuse', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
	});

	afterEach(() => {
		container.remove();
	});

	const list = (items: string[]) => html`<ul>${items.map((item) => html`<li class="row">${item}</li>`)}</ul>`;

	it('keeps the same node references when re-rendered with unchanged content', () => {
		render(list(['a', 'b', 'c']), container);
		const first = Array.from(container.querySelectorAll('li'));

		render(list(['a', 'b', 'c']), container);
		const second = Array.from(container.querySelectorAll('li'));

		expect(second.length).toBe(3);
		for (let i = 0; i < first.length; i++) {
			expect(second[i]).toBe(first[i]);
		}
	});

	it('keeps node identity while updating item content', () => {
		render(list(['a', 'b']), container);
		const [firstRow, secondRow] = Array.from(container.querySelectorAll('li'));

		render(list(['a', 'changed']), container);

		const rows = Array.from(container.querySelectorAll('li'));
		expect(rows[0]).toBe(firstRow);
		expect(rows[1]).toBe(secondRow);
		expect(rows[1].textContent).toBe('changed');
	});

	// The regression this whole change exists for. happy-dom (like jsdom) does
	// not synthesize `click` from separate mousedown/mouseup dispatches the way
	// a real browser does, so this asserts the precondition the browser needs:
	// the node that received mousedown is still the live, connected node after
	// the re-render, and a click on it still reaches the handler.
	it('a list item stays clickable across a re-render that happens mid-press', () => {
		const clicks: string[] = [];
		const clickable = (items: string[]) =>
			html`<ul>
				${items.map((item) => html`<li class="row" @click=${() => clicks.push(item)}>${item}</li>`)}
			</ul>`;

		render(clickable(['a', 'b']), container);
		const pressed = container.querySelectorAll('li')[1];

		pressed.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

		// Something re-renders between press and release (a signal on an
		// animation-frame clock, a resize observer, a poll…).
		render(clickable(['a', 'b']), container);

		expect(pressed.isConnected).toBe(true);
		expect(container.querySelectorAll('li')[1]).toBe(pressed);

		pressed.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
		pressed.dispatchEvent(new MouseEvent('click', { bubbles: true }));

		expect(clicks).toEqual(['b']);
	});

	it('reuses the leading items when the array grows', () => {
		render(list(['a', 'b']), container);
		const before = Array.from(container.querySelectorAll('li'));

		render(list(['a', 'b', 'c', 'd']), container);
		const after = Array.from(container.querySelectorAll('li'));

		expect(after.length).toBe(4);
		expect(after[0]).toBe(before[0]);
		expect(after[1]).toBe(before[1]);
		expect(after.map((row) => row.textContent)).toEqual(['a', 'b', 'c', 'd']);
	});

	it('reuses the survivors and removes the tail when the array shrinks', () => {
		render(list(['a', 'b', 'c']), container);
		const before = Array.from(container.querySelectorAll('li'));

		render(list(['a', 'b']), container);
		const after = Array.from(container.querySelectorAll('li'));

		expect(after.length).toBe(2);
		expect(after[0]).toBe(before[0]);
		expect(after[1]).toBe(before[1]);
		expect(before[2].isConnected).toBe(false);
	});

	it('renders an empty array by removing every item', () => {
		render(list(['a', 'b']), container);
		render(list([]), container);

		expect(container.querySelectorAll('li').length).toBe(0);
		expect(container.textContent?.trim()).toBe('');
	});

	it('rebuilds only the index whose template structure changed, in place', () => {
		const mixed = (flagged: boolean) =>
			html`<ul>
				${[html`<li>a</li>`, flagged ? html`<li><strong>b</strong></li>` : html`<li>b</li>`, html`<li>c</li>`]}
			</ul>`;

		render(mixed(false), container);
		const before = Array.from(container.querySelectorAll('li'));

		render(mixed(true), container);
		const after = Array.from(container.querySelectorAll('li'));

		// Order is preserved — the rebuilt item lands back at its own index
		// rather than being appended at the end of the list.
		expect(after.map((row) => row.textContent)).toEqual(['a', 'b', 'c']);
		expect(after[0]).toBe(before[0]);
		expect(after[2]).toBe(before[2]);
		expect(after[1]).not.toBe(before[1]);
		expect(after[1].querySelector('strong')?.textContent).toBe('b');
	});

	it('handles an index changing value type (template ↔ node ↔ primitive)', () => {
		const node = document.createElement('span');
		node.textContent = 'node';

		const mixed = (middle: unknown) => html`<div>${['start', middle, 'end']}</div>`;

		render(mixed(html`<em>tpl</em>`), container);
		expect(container.querySelector('em')?.textContent).toBe('tpl');
		expect(container.textContent).toBe('starttplend');

		render(mixed(node), container);
		expect(container.querySelector('em')).toBeNull();
		expect(container.textContent).toBe('startnodeend');
		expect(node.isConnected).toBe(true);

		render(mixed('plain'), container);
		expect(node.isConnected).toBe(false);
		expect(container.textContent).toBe('startplainend');

		render(mixed(html`<em>tpl again</em>`), container);
		expect(container.textContent).toBe('starttpl againend');
	});

	it('updates a primitive item without replacing its text node', () => {
		render(html`<div>${['a', 'b']}</div>`, container);
		const textNode = container.firstElementChild!.firstChild;

		render(html`<div>${['changed', 'b']}</div>`, container);

		expect(container.firstElementChild!.firstChild).toBe(textNode);
		expect(container.textContent).toBe('changedb');
	});

	it('switches between an unkeyed array and other content without leaving nodes behind', () => {
		const content = (value: unknown) => html`<div>${value}</div>`;

		render(content(['a', 'b'].map((item) => html`<span>${item}</span>`)), container);
		expect(container.querySelectorAll('span').length).toBe(2);

		render(content(html`<p>single</p>`), container);
		expect(container.querySelectorAll('span').length).toBe(0);
		expect(container.textContent).toBe('single');

		render(content(['x', 'y', 'z'].map((item) => html`<span>${item}</span>`)), container);
		expect(container.querySelectorAll('p').length).toBe(0);
		expect(Array.from(container.querySelectorAll('span')).map((node) => node.textContent)).toEqual(['x', 'y', 'z']);

		render(content('text'), container);
		expect(container.querySelectorAll('span').length).toBe(0);
		expect(container.textContent).toBe('text');
	});

	// Backs the migration note in the changelog: custom elements inside unkeyed
	// arrays used to be destroyed and recreated on every render, so onCreate and
	// onDestroy fired every time. They now fire once, for the real creation.
	it('does not recreate custom elements inside an unkeyed array on re-render', async () => {
		let created = 0;
		let destroyed = 0;

		class RowComponent {
			label = '';

			public onCreate(): void {
				created += 1;
			}

			public onDestroy(): void {
				destroyed += 1;
			}
		}

		MelodicComponent({
			selector: 'test-unkeyed-row',
			template: (component: RowComponent) => html`<span>${component.label}</span>`
		})(RowComponent);

		const host = (labels: string[]) => html`<div>${labels.map((label) => html`<test-unkeyed-row .label=${label}></test-unkeyed-row>`)}</div>`;

		render(host(['a', 'b']), container);
		await new Promise<void>((resolve) => queueMicrotask(resolve));
		expect(created).toBe(2);

		const rows = Array.from(container.querySelectorAll('test-unkeyed-row'));

		render(host(['a', 'updated']), container);
		render(host(['a', 'updated']), container);
		await new Promise<void>((resolve) => queueMicrotask(resolve));

		expect(created).toBe(2);
		expect(destroyed).toBe(0);
		expect(Array.from(container.querySelectorAll('test-unkeyed-row'))).toEqual(rows);
		expect(rows[1].shadowRoot?.textContent).toContain('updated');

		render(host(['a']), container);
		await new Promise<void>((resolve) => queueMicrotask(resolve));
		expect(destroyed).toBe(1);
	});

	it('switches from an unkeyed array to repeat() without leaving nodes behind', () => {
		const items = [{ id: 1, label: 'one' }, { id: 2, label: 'two' }];

		render(html`<ul>${items.map((item) => html`<li>${item.label}</li>`)}</ul>`, container);
		expect(container.querySelectorAll('li').length).toBe(2);

		render(html`<ul>${repeat(items, (item) => item.id, (item) => html`<li>${item.label}</li>`)}</ul>`, container);
		expect(container.querySelectorAll('li').length).toBe(2);
		expect(container.textContent).toContain('one');

		render(html`<ul>${items.map((item) => html`<li>${item.label}</li>`)}</ul>`, container);
		expect(container.querySelectorAll('li').length).toBe(2);
	});
});

describe('unkeyed array dev warnings', () => {
	let container: HTMLElement;
	let warn: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		container = document.createElement('div');
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		warn.mockRestore();
	});

	const churnWarnings = () => warn.mock.calls.filter((call) => String(call[0]).includes('repeat(items, keyFn, template)'));
	const mixedKeyWarnings = () => warn.mock.calls.filter((call) => String(call[0]).includes('mixes keyed and unkeyed items'));

	/** Alternating structures at several indices force real rebuilds. */
	const churning = (flip: boolean) =>
		html`<ul>
			${[0, 1, 2].map((index) => (flip ? html`<li><em>${index}</em></li>` : html`<li><strong>${index}</strong></li>`))}
		</ul>`;

	it('does not warn on the first render of an unkeyed array', () => {
		render(churning(false), container);
		expect(churnWarnings()).toHaveLength(0);
	});

	it('does not warn when positional reuse succeeds', () => {
		const stable = (items: string[]) => html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`;

		render(stable(['a', 'b', 'c']), container);
		render(stable(['a', 'b', 'd']), container);
		render(stable(['a', 'b']), container);
		render(stable(['a', 'b', 'e', 'f']), container);

		expect(churnWarnings()).toHaveLength(0);
	});

	it('warns once per part when items actually churn on re-render', () => {
		render(churning(false), container);
		render(churning(true), container);
		render(churning(false), container);
		render(churning(true), container);

		expect(churnWarnings()).toHaveLength(1);
		expect(String(churnWarnings()[0][0])).toContain('[melodic]');
	});

	it('does not warn for a keyed repeat() list', () => {
		const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const keyed = (flip: boolean) =>
			html`<ul>
				${repeat(items, (item) => item.id, (item) => (flip ? html`<li><em>${item.id}</em></li>` : html`<li><strong>${item.id}</strong></li>`))}
			</ul>`;

		render(keyed(false), container);
		render(keyed(true), container);

		expect(churnWarnings()).toHaveLength(0);
	});

	it('warns once when an array mixes keyed and unkeyed items', () => {
		const mixed = () =>
			html`<ul>
				${[{ __keyed: true, key: 'a', value: html`<li>a</li>` }, html`<li>b</li>`]}
			</ul>`;

		render(mixed(), container);
		render(mixed(), container);

		expect(mixedKeyWarnings()).toHaveLength(1);
	});

	it('does not warn when every item is keyed', () => {
		const allKeyed = () =>
			html`<ul>
				${[
					{ __keyed: true, key: 'a', value: html`<li>a</li>` },
					{ __keyed: true, key: 'b', value: html`<li>b</li>` }
				]}
			</ul>`;

		render(allKeyed(), container);
		render(allKeyed(), container);

		expect(mixedKeyWarnings()).toHaveLength(0);
	});

	it('stays silent in production builds', () => {
		const original = import.meta.env.DEV;
		try {
			(import.meta.env as { DEV: boolean }).DEV = false;

			render(churning(false), container);
			render(churning(true), container);

			const mixedPart = document.createElement('div');
			const mixed = html`<ul>
				${[{ __keyed: true, key: 'a', value: html`<li>a</li>` }, html`<li>b</li>`]}
			</ul>`;
			render(mixed, mixedPart);
			render(
				html`<ul>
					${[{ __keyed: true, key: 'a', value: html`<li>a</li>` }, html`<li>b</li>`]}
				</ul>`,
				mixedPart
			);

			expect(churnWarnings()).toHaveLength(0);
			expect(mixedKeyWarnings()).toHaveLength(0);
		} finally {
			(import.meta.env as { DEV: boolean }).DEV = original;
		}
	});
});
