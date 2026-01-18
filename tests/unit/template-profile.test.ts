import { describe, it } from 'vitest';
import { html, render, repeat } from '../../src/template';

const TEST_COUNT = 1000;
const generateItems = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		id: i,
		text: `Item ${i}`,
		value: Math.random(),
		active: i % 2 === 0
	}));

describe('template performance profiling', () => {
	it('profiles initial render with repeat directive', () => {
		const container = document.createElement('div');
		const items = generateItems(TEST_COUNT);

		// Profile the render
		const start = performance.now();

		const template = html`
			<ul>
				${repeat(
					items,
					(item) => item.id,
					(item) => html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
				)}
			</ul>
		`;

		const templateCreated = performance.now();

		render(template, container);

		const renderComplete = performance.now();

		console.log('\n=== INITIAL RENDER PROFILE ===');
		console.log(`Template creation: ${(templateCreated - start).toFixed(2)}ms`);
		console.log(`Render execution: ${(renderComplete - templateCreated).toFixed(2)}ms`);
		console.log(`Total: ${(renderComplete - start).toFixed(2)}ms`);
		console.log(`Items rendered: ${container.querySelectorAll('li').length}`);
	});

	it('profiles warm render with repeat directive', () => {
		const container = document.createElement('div');
		const items = generateItems(TEST_COUNT);

		// Warm up - first render
		render(
			html`
				<ul>
					${repeat(
						items,
						(item) => item.id,
						(item) => html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
					)}
				</ul>
			`,
			container
		);

		// Clear for fresh render
		container.innerHTML = '';
		delete (container as any).__parts;
		delete (container as any).__templateKey;

		// Profile warm render
		const start = performance.now();

		render(
			html`
				<ul>
					${repeat(
						items,
						(item) => item.id,
						(item) => html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
					)}
				</ul>
			`,
			container
		);

		const end = performance.now();

		console.log('\n=== WARM RENDER PROFILE ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
	});

	it('profiles simple render without repeat (baseline)', () => {
		const container = document.createElement('div');

		const start = performance.now();

		// Simple template without repeat
		render(html`<div class="test">Hello World</div>`, container);

		const end = performance.now();

		console.log('\n=== SIMPLE RENDER (BASELINE) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
	});

	it('profiles repeat directive item creation', () => {
		const items = generateItems(TEST_COUNT);

		// Profile just the template creation (no render)
		const start = performance.now();

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`;
		}

		const end = performance.now();

		console.log('\n=== TEMPLATE CREATION ONLY (1000 items) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per item: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles renderInto calls', () => {
		const items = generateItems(TEST_COUNT);

		// Profile renderInto on fresh containers
		const start = performance.now();

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const container = document.createDocumentFragment();
			const template = html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`;
			render(template, container);
		}

		const end = performance.now();

		console.log('\n=== RENDER INTO FRESH CONTAINERS (1000 items) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per item: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles DOM cloning overhead', () => {
		// Create a template element
		const templateEl = document.createElement('template');
		templateEl.innerHTML = '<li class="active">Item 0: 0.50</li>';

		const start = performance.now();

		for (let i = 0; i < TEST_COUNT; i++) {
			templateEl.content.cloneNode(true);
		}

		const end = performance.now();

		console.log('\n=== DOM CLONING ONLY (1000 clones) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per clone: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles template cache lookup', () => {
		const strings = ['<li class="', '">', ': ', '</li>'] as unknown as TemplateStringsArray;

		// First call to populate cache
		html(strings, 'active', 'Item 0', '0.50');

		const start = performance.now();

		for (let i = 0; i < TEST_COUNT; i++) {
			html(strings, 'active', `Item ${i}`, (i * 0.001).toFixed(2));
		}

		const end = performance.now();

		console.log('\n=== TEMPLATE CACHE LOOKUP (1000 lookups, same strings) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per lookup: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles DOM walking overhead', () => {
		// Create a template with similar structure to repeat items
		const templateEl = document.createElement('template');
		templateEl.innerHTML = '<li class="active">Item 0: 0.50</li>';

		const start = performance.now();

		for (let i = 0; i < TEST_COUNT; i++) {
			const clone = templateEl.content.cloneNode(true) as DocumentFragment;

			// Simulate walking the DOM
			const walk = (node: Node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const element = node as Element;
					// Check attributes (simulating what prepareParts does)
					for (let j = element.attributes.length - 1; j >= 0; j--) {
						const attr = element.attributes[j];
						if (attr.name.startsWith('__')) {
							// Would process marker
						}
					}
				}
				// Walk children
				const children = node.childNodes;
				for (let j = 0; j < children.length; j++) {
					walk(children[j]);
				}
			};

			walk(clone);
		}

		const end = performance.now();

		console.log('\n=== DOM WALKING ONLY (1000 walks) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per walk: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles object creation overhead', () => {
		const templatePart = { type: 'node', index: 0, name: 'test' };

		const start = performance.now();

		const parts: any[] = [];
		for (let i = 0; i < TEST_COUNT; i++) {
			// Simulate creating part objects like prepareParts does
			parts.push({
				...templatePart,
				node: document.createTextNode('')
			});
		}

		const end = performance.now();

		console.log('\n=== OBJECT CREATION (1000 objects with spread) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per object: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles parseInt and regex overhead', () => {
		const attrNames = Array.from({ length: TEST_COUNT }, (_, i) => `__event-${i}__`);

		const start = performance.now();

		for (const name of attrNames) {
			const match = name.match(/__event-(\d+)__/);
			if (match) {
				parseInt(match[1], 10);
			}
		}

		const end = performance.now();

		console.log('\n=== PARSEINT + REGEX (1000 operations) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per operation: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles direct DOM manipulation (setAttribute/textContent)', () => {
		const container = document.createElement('div');

		// Create elements
		const elements: HTMLElement[] = [];
		for (let i = 0; i < TEST_COUNT; i++) {
			const li = document.createElement('li');
			li.appendChild(document.createTextNode(''));
			li.appendChild(document.createTextNode(''));
			li.appendChild(document.createTextNode(''));
			container.appendChild(li);
			elements.push(li);
		}

		const start = performance.now();

		// Simulate what commit() does for each item
		for (let i = 0; i < TEST_COUNT; i++) {
			const li = elements[i];
			li.setAttribute('class', i % 2 === 0 ? 'active' : '');
			(li.childNodes[0] as Text).textContent = `Item ${i}`;
			(li.childNodes[1] as Text).textContent = ': ';
			(li.childNodes[2] as Text).textContent = (i * 0.001).toFixed(2);
		}

		const end = performance.now();

		console.log('\n=== DIRECT DOM MANIPULATION (1000 items x 4 operations) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per item: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles DocumentFragment operations', () => {
		const start = performance.now();

		for (let i = 0; i < TEST_COUNT; i++) {
			const frag = document.createDocumentFragment();
			const li = document.createElement('li');
			li.className = 'active';
			li.textContent = `Item ${i}: ${(i * 0.001).toFixed(2)}`;
			frag.appendChild(li);
		}

		const end = performance.now();

		console.log('\n=== DOCUMENTFRAGMENT CREATION (1000 fragments) ===');
		console.log(`Total: ${(end - start).toFixed(2)}ms`);
		console.log(`Per fragment: ${((end - start) / TEST_COUNT).toFixed(4)}ms`);
	});

	it('profiles renderOnce vs renderInto', () => {
		const items = generateItems(TEST_COUNT);

		// Test renderOnce
		const startOnce = performance.now();
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const container = document.createDocumentFragment();
			const template = html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`;
			template.renderOnce(container);
		}
		const endOnce = performance.now();

		// Test renderInto
		const startInto = performance.now();
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const container = document.createDocumentFragment();
			const template = html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`;
			render(template, container);
		}
		const endInto = performance.now();

		console.log('\n=== RENDERONCE vs RENDERINTO (1000 items) ===');
		console.log(`renderOnce: ${(endOnce - startOnce).toFixed(2)}ms`);
		console.log(`renderInto: ${(endInto - startInto).toFixed(2)}ms`);
		console.log(`Speedup: ${((endInto - startInto) / (endOnce - startOnce)).toFixed(2)}x`);
	});
});
