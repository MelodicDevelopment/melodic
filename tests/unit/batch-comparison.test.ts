import { describe, it, expect } from 'vitest';
import { html, render, repeat } from '../../src/template';

const TEST_COUNT = 1000;

const generateItems = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		id: i,
		text: `Item ${i}`,
		value: Math.random(),
		active: i % 2 === 0
	}));

describe('batch rendering comparison', () => {
	it('compares current approach vs theoretical minimum', () => {
		const items = generateItems(TEST_COUNT);

		// Simulate React's approach - pure JS objects then single DOM build
		const reactStart = performance.now();
		const vdomNodes = [];
		for (let i = 0; i < TEST_COUNT; i++) {
			vdomNodes.push({
				type: 'li',
				props: { className: items[i].active ? 'active' : '' },
				children: `${items[i].text}: ${items[i].value.toFixed(2)}`
			});
		}
		// Single DOM construction
		const ul = document.createElement('ul');
		for (const vnode of vdomNodes) {
			const li = document.createElement('li');
			li.className = vnode.props.className;
			li.textContent = vnode.children;
			ul.appendChild(li);
		}
		const reactEnd = performance.now();

		// Direct createElement approach (theoretical minimum)
		const directStart = performance.now();
		const ul4 = document.createElement('ul');
		for (const item of items) {
			const li = document.createElement('li');
			li.className = item.active ? 'active' : '';
			li.textContent = `${item.text}: ${item.value.toFixed(2)}`;
			ul4.appendChild(li);
		}
		const directEnd = performance.now();

		// Melodic repeat with compiled template
		const melodicStart = performance.now();
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
		const melodicEnd = performance.now();

		console.log('\n=== APPROACH COMPARISON (1000 items) ===');
		console.log(`React-style (vdom + build):   ${(reactEnd - reactStart).toFixed(2)}ms`);
		console.log(`Direct createElement:         ${(directEnd - directStart).toFixed(2)}ms`);
		console.log(`Melodic repeat (compiled):    ${(melodicEnd - melodicStart).toFixed(2)}ms`);
		console.log(`\nMelodic vs Direct: ${((melodicEnd - melodicStart) / (directEnd - directStart)).toFixed(2)}x`);
		console.log(`Melodic vs React:  ${((melodicEnd - melodicStart) / (reactEnd - reactStart)).toFixed(2)}x`);

		// Verify DOM is correct
		expect(container.querySelectorAll('li').length).toBe(TEST_COUNT);
	});
});
