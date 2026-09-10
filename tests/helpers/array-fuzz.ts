/**
 * Randomised exerciser for the three list-rendering paths — plain keyed
 * arrays, plain unkeyed arrays and `repeat()` — whose items contain a nested
 * conditional that swaps its own nodes. After every random mutation it checks:
 *
 *   - the rendered text matches the model, in order (catches lost, duplicated
 *     or misordered items and stale nested content);
 *   - for plain arrays, the DOM between the part's markers is EXACTLY
 *     `[text node] (item-start … item-end)*` with one group per item (catches
 *     stray nodes and validates the layout `firstArrayNode` relies on);
 *   - live attribute-directive setups minus cleanups equals the number of
 *     live nested blocks (catches double or missing disposal).
 *
 * Shared by the vitest suite (happy-dom) and a headless-Chrome page, so the
 * same sequences run against a real DOM.
 */
import { html, render, type TemplateResult } from '../../src/template';
import { repeat } from '../../src/template/directives/builtin/repeat.directive';
import { registerAttributeDirective, unregisterAttributeDirective } from '../../src/template/directives/functions/attribute-directive.functions';

export type Mode = 'keyed' | 'unkeyed' | 'repeat';

type Kind = 'tpl' | 'alt' | 'text' | 'node';

interface Item {
	key: number;
	kind: Kind;
	version: number;
	inner: boolean;
	node?: Element;
}

export interface FuzzResult {
	mode: Mode;
	seed: number;
	steps: number;
	failures: string[];
}

function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const KINDS: Kind[] = ['tpl', 'alt', 'text', 'node'];

function label(item: Item): string {
	return `k${item.key}v${item.version}`;
}

function expectedText(item: Item): string {
	if (item.kind === 'tpl') return `${label(item)} ${item.inner ? 'X' : 'Y'}`;
	return label(item);
}

const row = (text: string, inner: boolean): TemplateResult => html`
	<div class="row">${text}</div>
	${inner ? html`<div class="x" :track=${1}>X</div>` : html`<div class="y" :track=${1}>Y</div>`}
`;

function valueFor(item: Item): unknown {
	switch (item.kind) {
		case 'tpl':
			return row(label(item), item.inner);
		case 'alt':
			return html`<span class="alt">${label(item)}</span>`;
		case 'text':
			return label(item);
		case 'node':
			if (!item.node) {
				item.node = document.createElement('b');
			}
			item.node.textContent = label(item);
			return item.node;
		default:
			throw new Error(`unknown kind ${item.kind as string}`);
	}
}

function view(mode: Mode, items: Item[]): TemplateResult {
	switch (mode) {
		case 'keyed':
			return html`<section>${items.map((item) => ({ __keyed: true, key: item.key, value: valueFor(item) }))}</section>`;
		case 'unkeyed':
			return html`<section>${items.map((item) => valueFor(item))}</section>`;
		case 'repeat':
			return html`<section>${repeat(
				items,
				(item) => item.key,
				(item) => {
					const value = valueFor(item);
					return value instanceof Object && 'strings' in (value as object) ? (value as TemplateResult) : html`${value}`;
				}
			)}</section>`;
		default:
			throw new Error(`unknown mode ${mode as string}`);
	}
}

function checkLayout(section: Element, itemCount: number): string | null {
	const nodes = Array.from(section.childNodes);
	let index = 0;
	const isComment = (node: Node | undefined, data: string) => node !== undefined && node.nodeType === Node.COMMENT_NODE && node.nodeValue === data;

	if (!isComment(nodes[index], 'part-start')) return `expected part-start at ${index}`;
	index++;
	if (nodes[index]?.nodeType !== Node.TEXT_NODE || nodes[index].nodeValue !== '') return `expected empty text node at ${index}`;
	index++;

	let groups = 0;
	while (isComment(nodes[index], 'item-start')) {
		index++;
		while (index < nodes.length && !isComment(nodes[index], 'item-end')) {
			if (isComment(nodes[index], 'item-start')) return `nested item-start at ${index}`;
			index++;
		}
		if (!isComment(nodes[index], 'item-end')) return `unterminated item group at ${index}`;
		index++;
		groups++;
	}

	if (!isComment(nodes[index], 'part-end')) return `unexpected node at ${index}: ${nodes[index]?.nodeName} "${nodes[index]?.nodeValue ?? ''}"`;
	if (index !== nodes.length - 1) return `nodes after part-end`;
	if (groups !== itemCount) return `expected ${itemCount} item groups, found ${groups}`;
	return null;
}

export interface FuzzOptions {
	/** Check the marker layout between the part's markers (plain arrays only). */
	layout?: boolean;
}

export function runArrayFuzz(mode: Mode, seed: number, steps: number, container: Element, options: FuzzOptions = {}): FuzzResult {
	const checkLayoutEnabled = options.layout ?? true;
	const random = mulberry32(seed);
	const pick = <T>(list: T[]): T => list[Math.floor(random() * list.length)];
	const int = (max: number) => Math.floor(random() * max);

	let setups = 0;
	let cleanups = 0;
	registerAttributeDirective('track', () => {
		setups += 1;
		return () => {
			cleanups += 1;
		};
	});

	const failures: string[] = [];
	let nextKey = 0;
	let items: Item[] = [];
	const newItem = (): Item => ({ key: nextKey++, kind: pick(KINDS), version: 0, inner: random() < 0.5 });

	const ops: Array<() => string> = [
		() => {
			const at = int(items.length + 1);
			items.splice(at, 0, newItem());
			return `insert@${at}`;
		},
		() => {
			if (items.length === 0) return 'noop';
			const at = int(items.length);
			items.splice(at, 1);
			return `remove@${at}`;
		},
		() => {
			if (items.length < 2) return 'noop';
			const a = int(items.length);
			const b = int(items.length);
			[items[a], items[b]] = [items[b], items[a]];
			return `swap ${a}<->${b}`;
		},
		() => {
			items = items.slice().sort(() => random() - 0.5);
			return 'shuffle';
		},
		() => {
			items.reverse();
			return 'reverse';
		},
		() => {
			if (items.length === 0) return 'noop';
			const item = pick(items);
			item.inner = !item.inner;
			return `toggle inner k${item.key}`;
		},
		() => {
			if (items.length === 0) return 'noop';
			const item = pick(items);
			item.kind = pick(KINDS);
			return `kind k${item.key}=${item.kind}`;
		},
		() => {
			if (items.length === 0) return 'noop';
			const item = pick(items);
			item.version++;
			return `bump k${item.key}`;
		},
		() => {
			items = [];
			return 'clear';
		},
		() => {
			items = Array.from({ length: int(5) }, newItem);
			return 'replace-all';
		},
		() => {
			// Several mutations in one render.
			for (const item of items) {
				if (random() < 0.5) item.inner = !item.inner;
				if (random() < 0.3) item.version++;
			}
			if (random() < 0.5) items.push(newItem());
			return 'multi';
		}
	];

	const log: string[] = [];
	try {
		render(view(mode, items), container);
		for (let step = 0; step < steps; step++) {
			const op = pick(ops)();
			log.push(op);
			render(view(mode, items), container);

			const section = container.querySelector('section')!;
			// Whitespace-insensitive: adjacent text items render with no separator.
			// Labels are self-delimiting tokens (k<key>v<version>, X, Y).
			const actual = section.textContent!.replace(/\s+/g, '');
			const expected = items.map(expectedText).join('').replace(/\s+/g, '');
			if (actual !== expected) {
				failures.push(`[${mode} seed ${seed} step ${step}] text mismatch after "${op}"\n  expected: ${expected}\n  actual:   ${actual}\n  ops: ${log.join(', ')}`);
				break;
			}

			if (checkLayoutEnabled && mode !== 'repeat') {
				const layout = checkLayout(section, items.length);
				if (layout) {
					failures.push(`[${mode} seed ${seed} step ${step}] layout: ${layout} after "${op}"\n  ops: ${log.join(', ')}`);
					break;
				}
			}

			const liveBlocks = section.querySelectorAll('.x, .y').length;
			if (setups - cleanups !== liveBlocks) {
				failures.push(`[${mode} seed ${seed} step ${step}] disposal: ${setups} setups - ${cleanups} cleanups != ${liveBlocks} live blocks after "${op}"\n  ops: ${log.join(', ')}`);
				break;
			}
		}

		// Final teardown must release everything.
		render(html`<section></section>`, container);
		if (setups !== cleanups) {
			failures.push(`[${mode} seed ${seed}] teardown: ${setups} setups vs ${cleanups} cleanups`);
		}
	} catch (error) {
		failures.push(`[${mode} seed ${seed}] threw after ${log[log.length - 1]}: ${(error as Error).stack ?? error}\n  ops: ${log.join(', ')}`);
	} finally {
		unregisterAttributeDirective('track');
	}

	return { mode, seed, steps, failures };
}
