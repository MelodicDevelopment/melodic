import { describe, it, expect, vi, afterEach } from 'vitest';
import { html, render, repeat, when, styleMap, unsafeHTML } from '../../src/template';
import { setDevMode, resetDevWarnings } from '../../src/devtools/dev-mode';

afterEach(() => {
	setDevMode(null);
	resetDevWarnings();
	vi.restoreAllMocks();
});

interface IUser {
	name?: { first: string };
}

describe('review 2026-11 — a throw during the first render is recoverable', () => {
	it('when(): a branch that throws does not kill the container', () => {
		const view = (user: IUser) => html`<h1>title</h1>${when(true, () => html`<p>${user.name!.first}</p>`)}`;
		const container = document.createElement('div');

		expect(() => render(view({}), container)).toThrow();
		render(view({ name: { first: 'Ada' } }), container);

		expect(container.querySelector('h1')!.textContent).toBe('title');
		expect(container.querySelector('p')!.textContent).toBe('Ada');
	});

	it('repeat(): an item template that throws does not kill the container', () => {
		const view = (users: IUser[]) =>
			html`<ul>
				${repeat(
					users,
					(_, index) => index,
					(user) => html`<li>${user.name!.first}</li>`
				)}
			</ul>`;
		const container = document.createElement('div');

		expect(() => render(view([{ name: { first: 'Ada' } }, {}]), container)).toThrow();
		render(view([{ name: { first: 'Ada' } }, { name: { first: 'Grace' } }]), container);

		expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['Ada', 'Grace']);
	});

	it('a directive that first appears on an UPDATE and throws can be retried', () => {
		const view = (show: boolean, user: IUser) => html`<div>${show ? when(true, () => html`<p>${user.name!.first}</p>`) : 'off'}</div>`;
		const container = document.createElement('div');

		render(view(false, {}), container);
		expect(() => render(view(true, {}), container)).toThrow();
		render(view(true, { name: { first: 'Ada' } }), container);

		expect(container.querySelector('p')!.textContent).toBe('Ada');
		expect(container.querySelectorAll('p')).toHaveLength(1);
	});

	it('when(): a branch that throws on a condition flip is retried on the next render', () => {
		const view = (on: boolean, user: IUser) =>
			html`<div>${when(
				on,
				() => html`<p>${user.name!.first}</p>`,
				() => html`<i>off</i>`
			)}</div>`;
		const container = document.createElement('div');

		render(view(false, {}), container);
		expect(() => render(view(true, {}), container)).toThrow();
		render(view(true, { name: { first: 'Ada' } }), container);

		expect(container.querySelector('p')!.textContent).toBe('Ada');
		expect(container.querySelector('i')).toBeNull();
	});

	it('repeat(): a throw during an update leaves the rendered list intact and retryable', () => {
		const view = (users: IUser[]) =>
			html`<ul>
				${repeat(
					users,
					(_, index) => index,
					(user) => html`<li>${user.name!.first}</li>`
				)}
			</ul>`;
		const container = document.createElement('div');
		const ada = { name: { first: 'Ada' } };

		render(view([ada]), container);
		expect(() => render(view([ada, {}]), container)).toThrow();
		expect(container.querySelectorAll('li')).toHaveLength(1);

		render(view([ada, { name: { first: 'Grace' } }]), container);
		expect(Array.from(container.querySelectorAll('li')).map((li) => li.textContent)).toEqual(['Ada', 'Grace']);
	});

	it('unsafeHTML still renders and updates', () => {
		const view = (markup: string) => html`<div>${unsafeHTML(markup)}</div>`;
		const container = document.createElement('div');
		render(view('<b>one</b>'), container);
		render(view('<i>two</i>'), container);
		expect(container.querySelector('i')!.textContent).toBe('two');
		expect(container.querySelector('b')).toBeNull();
	});
});

describe('review 2026-11 — bindings commit in source order', () => {
	it('writes attributes in the order they are written in the template', () => {
		const written: string[] = [];
		const original = Element.prototype.setAttribute;
		vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (this: Element, name: string, value: string) {
			written.push(name);
			return original.call(this, name, value);
		});

		render(html`<i first=${1} second=${2} third=${3}></i>`, document.createElement('div'));

		expect(written.filter((name) => ['first', 'second', 'third'].includes(name))).toEqual(['first', 'second', 'third']);
	});

	it('commits mixed property, attribute and event bindings in source order', () => {
		const order: string[] = [];
		const container = document.createElement('div');

		class Probe extends HTMLElement {
			public set alpha(_: unknown) {
				order.push('alpha');
			}
			public set gamma(_: unknown) {
				order.push('gamma');
			}
			public override setAttribute(name: string, value: string): void {
				order.push(name);
				super.setAttribute(name, value);
			}
		}
		customElements.define('render-fixes-order-probe', Probe);

		// The element must be upgraded for its setters to run, so render into a connected container.
		document.body.appendChild(container);
		render(html`<render-fixes-order-probe .alpha=${1} beta=${2} .gamma=${3}></render-fixes-order-probe>`, container);
		render(html`<render-fixes-order-probe .alpha=${4} beta=${5} .gamma=${6}></render-fixes-order-probe>`, container);
		container.remove();

		expect(order.slice(-3)).toEqual(['alpha', 'beta', 'gamma']);
	});

	it('a range input keeps a value above the default max when max is written first', () => {
		const container = document.createElement('div');
		render(html`<input type="range" min=${0} max=${200} .value=${150} />`, container);
		expect(container.querySelector('input')!.value).toBe('150');
	});
});

describe('review 2026-11 — instantiated templates carry no parser markers', () => {
	it('leaves no marker attributes or comments in the rendered DOM', () => {
		const container = document.createElement('div');
		const noop = (): void => undefined;
		render(html`<p class=${'a'} ?hidden=${false} .myProp=${'t'} @click=${noop} data-x="a ${1} b">${'text'}</p>`, container);

		const p = container.querySelector('p')!;
		expect(p.getAttributeNames().sort()).toEqual(['class', 'data-x']);
		expect(p.getAttribute('data-x')).toBe('a 1 b');
		expect(p.textContent).toBe('text');
		expect(container.innerHTML).not.toContain('__');

		// A second instance of the same template is independent of the first.
		const other = document.createElement('div');
		render(html`<p class=${'b'} ?hidden=${true} .myProp=${'u'} @click=${noop} data-x="a ${2} b">${'more'}</p>`, other);
		expect(other.querySelector('p')!.getAttribute('class')).toBe('b');
		expect(p.getAttribute('class')).toBe('a');
	});
});

describe('review 2026-11 — styleMap', () => {
	it('keeps the case of custom property names', () => {
		const container = document.createElement('div');
		const view = (styles: Record<string, string | undefined>) => html`<b style=${styleMap(styles)}></b>`;

		render(view({ '--rowHeight': '4px', fontSize: '12px' }), container);
		const b = container.querySelector('b')!;
		expect(b.style.getPropertyValue('--rowHeight')).toBe('4px');
		expect(b.style.getPropertyValue('--row-height')).toBe('');
		expect(b.style.getPropertyValue('font-size')).toBe('12px');

		render(view({ fontSize: '12px' }), container);
		expect(b.style.getPropertyValue('--rowHeight')).toBe('');
	});
});

describe('review 2026-11 — scriptable attribute warnings (dev only)', () => {
	it('warns about a javascript: URL bound to href', () => {
		setDevMode(true);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const container = document.createElement('div');

		render(html`<a href=${' JavaScript:alert(1)'}>x</a>`, container);

		expect(warn.mock.calls.some((call) => String(call[1]).includes('javascript:'))).toBe(true);
		// Advisory only — the value is still written.
		expect(container.querySelector('a')!.getAttribute('href')).toBe(' JavaScript:alert(1)');
	});

	it('warns about a string bound to an inline event handler attribute', () => {
		setDevMode(true);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		render(html`<button onclick=${'doThing()'}>x</button>`, document.createElement('div'));

		expect(warn.mock.calls.some((call) => String(call[1]).includes('inline event handler'))).toBe(true);
	});

	it('stays quiet for ordinary URLs and in production', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		setDevMode(true);
		render(html`<a href=${'https://example.com/javascript:'} title=${'online'}>x</a>`, document.createElement('div'));
		setDevMode(false);
		render(html`<a href=${'javascript:void 0'}>x</a>`, document.createElement('div'));

		expect(warn).not.toHaveBeenCalled();
	});
});

describe('review 2026-11 — repeat() reconciliation after batching', () => {
	interface IRow {
		id: number;
		label: string;
	}

	const view = (rows: IRow[]) =>
		html`<ul>
			<li class="head">head</li>
			${repeat(
				rows,
				(row) => row.id,
				(row) => html`<li data-id=${row.id}>${row.label}</li>`
			)}
			<li class="tail">tail</li>
		</ul>`;

	const ids = (container: Element): number[] => Array.from(container.querySelectorAll('li[data-id]')).map((li) => Number(li.getAttribute('data-id')));
	const rows = (...list: number[]): IRow[] => list.map((id) => ({ id, label: `row ${id}` }));

	it('inserts runs of new items at the front, middle and end in order', () => {
		const container = document.createElement('div');
		render(view(rows(3, 6)), container);
		const three = container.querySelector('li[data-id="3"]');

		render(view(rows(1, 2, 3, 4, 5, 6, 7, 8)), container);

		expect(ids(container)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
		expect(container.querySelector('li[data-id="3"]')).toBe(three);
		expect(container.querySelector('ul')!.firstElementChild!.className).toBe('head');
		expect(container.querySelector('ul')!.lastElementChild!.className).toBe('tail');
	});

	it('clears the whole list without touching its siblings', () => {
		const container = document.createElement('div');
		render(view(rows(1, 2, 3)), container);
		render(view([]), container);

		expect(ids(container)).toEqual([]);
		expect(Array.from(container.querySelectorAll('li')).map((li) => li.className)).toEqual(['head', 'tail']);

		render(view(rows(9)), container);
		expect(ids(container)).toEqual([9]);
	});

	it('replaces every row when no key survives, disposing the old rows', () => {
		const container = document.createElement('div');
		const cleanups: number[] = [];
		const withHandlers = (list: IRow[]) =>
			html`<ul>
				${repeat(
					list,
					(row) => row.id,
					(row) => html`<li data-id=${row.id} @click=${() => cleanups.push(row.id)}>${row.label}</li>`
				)}
			</ul>`;

		render(withHandlers(rows(1, 2, 3)), container);
		const stale = container.querySelector('li[data-id="1"]') as HTMLElement;

		render(withHandlers(rows(4, 5)), container);

		expect(ids(container)).toEqual([4, 5]);
		expect(stale.isConnected).toBe(false);
		// The removed row's listener was released with its part tree.
		stale.click();
		expect(cleanups).toEqual([]);
	});

	it('matches the expected order across random edits', () => {
		const container = document.createElement('div');
		let seed = 12345;
		const random = (): number => {
			seed = (seed * 1103515245 + 12345) & 0x7fffffff;
			return seed / 0x7fffffff;
		};

		let current: number[] = [];
		let nextId = 1;
		for (let round = 0; round < 200; round++) {
			const next = current.filter(() => random() > 0.3);
			const additions = Math.floor(random() * 4);
			for (let i = 0; i < additions; i++) {
				next.splice(Math.floor(random() * (next.length + 1)), 0, nextId++);
			}
			if (random() > 0.5) {
				next.sort(() => random() - 0.5);
			}
			if (random() > 0.95) {
				next.length = 0;
			}

			const before = new Map(Array.from(container.querySelectorAll('li[data-id]')).map((li) => [Number(li.getAttribute('data-id')), li]));
			render(view(rows(...next)), container);

			expect(ids(container)).toEqual(next);
			for (const li of container.querySelectorAll('li[data-id]')) {
				const id = Number(li.getAttribute('data-id'));
				if (before.has(id)) {
					// A surviving key keeps its element.
					expect(before.get(id)).toBe(li);
				}
			}
			current = next;
		}
	});

	it('still warns about duplicate keys in dev', () => {
		setDevMode(true);
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		render(view([...rows(1), ...rows(1)]), document.createElement('div'));
		expect(warn.mock.calls.some((call) => String(call[1]).includes('duplicate key'))).toBe(true);
	});
});
