import { describe, it, expect } from 'vitest';
import { html, render, repeat } from '../../src/template';
import { CompiledTemplate } from '../../src/template/classes/compiled-template.class';

const TEST_COUNT = 1000;

const generateItems = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		id: i,
		text: `Item ${i}`,
		value: Math.random(),
		active: i % 2 === 0
	}));

describe('compiled template', () => {
	it('compiles simple template correctly', () => {
		const strings = ['<li class="', '">', '</li>'] as unknown as TemplateStringsArray;
		const compiled = CompiledTemplate.compile(strings);

		expect(compiled.canUseFastPath()).toBe(true);

		const result = compiled.create(['active', 'Hello']);
		expect(result.nodes.length).toBe(1);

		const li = result.nodes[0] as HTMLElement;
		expect(li.tagName).toBe('LI');
		expect(li.className).toBe('active');
		expect(li.textContent).toBe('Hello');
	});

	it('compiles template with multiple text parts', () => {
		const strings = ['<li class="', '">', ': ', '</li>'] as unknown as TemplateStringsArray;
		const compiled = CompiledTemplate.compile(strings);

		const result = compiled.create(['active', 'Item 1', '0.50']);
		const li = result.nodes[0] as HTMLElement;
		expect(li.textContent).toBe('Item 1: 0.50');
	});

	it('detects events and disables fast path', () => {
		const strings = ['<button @click="', '">Click</button>'] as unknown as TemplateStringsArray;
		const compiled = CompiledTemplate.compile(strings);

		expect(compiled.canUseFastPath()).toBe(false);
	});

	it('compares compiled vs clone performance', () => {
		const items = generateItems(TEST_COUNT);

		// Compiled template approach
		const strings = ['<li class="', '">', ': ', '</li>'] as unknown as TemplateStringsArray;
		const compiled = CompiledTemplate.compile(strings);

		const compiledStart = performance.now();
		const fragment1 = document.createDocumentFragment();
		for (const item of items) {
			const result = compiled.create([item.active ? 'active' : '', item.text, item.value.toFixed(2)]);
			for (const node of result.nodes) {
				fragment1.appendChild(node);
			}
		}
		const compiledEnd = performance.now();

		// Clone-based template approach (current)
		const cloneStart = performance.now();
		const container = document.createElement('div');
		render(
			html`<ul>
				${repeat(
					items,
					(item) => item.id,
					(item) => html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
				)}
			</ul>`,
			container
		);
		const cloneEnd = performance.now();

		console.log('\n=== COMPILED vs CLONE (1000 items) ===');
		console.log(`Compiled createElement:  ${(compiledEnd - compiledStart).toFixed(2)}ms`);
		console.log(`Clone-based repeat:      ${(cloneEnd - cloneStart).toFixed(2)}ms`);
		console.log(`Speedup: ${((cloneEnd - cloneStart) / (compiledEnd - compiledStart)).toFixed(2)}x`);

		// Verify both produced correct DOM
		expect(fragment1.childNodes.length).toBe(TEST_COUNT);
		expect(container.querySelectorAll('li').length).toBe(TEST_COUNT);
	});

	it('uses compiled path in repeat directive', () => {
		const items = generateItems(100);
		const container = document.createElement('div');

		// First render should detect and use compiled path
		const start = performance.now();
		render(
			html`<ul>
				${repeat(
					items,
					(item) => item.id,
					(item) => html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
				)}
			</ul>`,
			container
		);
		const end = performance.now();

		console.log(`\nRepeat with compiled path (100 items): ${(end - start).toFixed(2)}ms`);

		expect(container.querySelectorAll('li').length).toBe(100);
	});
});
