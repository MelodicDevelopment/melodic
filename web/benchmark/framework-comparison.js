let melodicModule;
if (import.meta.env.PROD) {
	melodicModule = await import('@melodic-lib');
} else {
	melodicModule = await import('@melodic-src');
}

const reactModule = await import('https://esm.sh/react@18.3.1');
const reactDomModule = await import('https://esm.sh/react-dom@18.3.1');
const reactDomClientModule = await import('https://esm.sh/react-dom@18.3.1/client');
const preactModule = await import('https://esm.sh/preact@10.23.1');
const vueModule = await import('https://unpkg.com/vue@3.4.38/dist/vue.esm-browser.js');
const litModule = await import('https://esm.sh/lit@3.1.3');
const litRepeatModule = await import('https://esm.sh/lit@3.1.3/directives/repeat.js');

const { html: melodicHtml, render: melodicRender, repeat: melodicRepeat, repeatRaw: melodicRepeatRaw } = melodicModule;
const React = reactModule;
const { flushSync } = reactDomModule;
const { createRoot } = reactDomClientModule;
const { h: preactH, render: preactRender } = preactModule;
const { createApp, h: vueH, ref: vueRef, nextTick: vueNextTick } = vueModule;
const { html: litHtml, render: litRender } = litModule;
const { repeat: litRepeat } = litRepeatModule;

const TEST_COUNT = 1000;
const PARTIAL_UPDATE_STEP = 100;
const ADD_REMOVE_COUNT = 100;

const resultsTableBody = document.querySelector('#results-table tbody');
const containersRoot = document.getElementById('containers');

// Measure JS execution time only - no paint wait
// This isolates framework overhead without browser rendering variance
const waitForPaint = () => Promise.resolve();

const generateItems = (count) =>
	Array.from({ length: count }, (_, i) => ({
		id: i,
		text: `Item ${i}`,
		value: Math.random(),
		active: i % 2 === 0
	}));

const updateItems = (items) =>
	items.map((item) => ({
		...item,
		value: Math.random(),
		active: !item.active
	}));

const partialUpdateItems = (items) =>
	items.map((item, index) => (index % PARTIAL_UPDATE_STEP === 0 ? { ...item, value: Math.random(), active: !item.active } : item));

const reorderItems = (items) => [...items].reverse();

const addRemoveItems = (items) => {
	const trimmed = items.slice(ADD_REMOVE_COUNT);
	const additions = Array.from({ length: ADD_REMOVE_COUNT }, (_, i) => ({
		id: items.length + i,
		text: `New Item ${i}`,
		value: Math.random(),
		active: false
	}));
	return [...trimmed, ...additions];
};

const createRow = (framework) => {
	const row = document.createElement('tr');
	row.innerHTML = `
		<td>${framework.label}</td>
		<td class="result-cell" data-test="initial"></td>
		<td class="result-cell" data-test="warm"></td>
		<td class="result-cell" data-test="update"></td>
		<td class="result-cell" data-test="partial"></td>
		<td class="result-cell" data-test="reorder"></td>
		<td class="result-cell" data-test="addRemove"></td>
	`;
	resultsTableBody.append(row);
	return row;
};

const createContainerCard = (framework) => {
	const card = document.createElement('div');
	card.className = 'container-card';
	card.innerHTML = `<h3>${framework.label} Render Target</h3><div class="container" data-framework="${framework.id}"></div>`;
	containersRoot.append(card);
	return card.querySelector('.container');
};

// Vanilla JS baseline - theoretical minimum for comparison
const vanillaAdapter = {
	id: 'vanilla',
	label: 'Vanilla JS',
	create(container) {
		return { container, ul: null, itemMap: new Map() };
	},
	render(state, items) {
		if (!state.ul) {
			// Initial render
			state.ul = document.createElement('ul');
			for (const item of items) {
				const li = document.createElement('li');
				li.className = item.active ? 'active' : '';
				li.textContent = `${item.text}: ${item.value.toFixed(2)}`;
				state.ul.appendChild(li);
				state.itemMap.set(item.id, li);
			}
			state.container.appendChild(state.ul);
		} else {
			// Update - simple keyed reconciliation
			const newMap = new Map();
			const fragment = document.createDocumentFragment();

			for (const item of items) {
				let li = state.itemMap.get(item.id);
				if (li) {
					// Update existing
					li.className = item.active ? 'active' : '';
					li.textContent = `${item.text}: ${item.value.toFixed(2)}`;
					state.itemMap.delete(item.id);
				} else {
					// Create new
					li = document.createElement('li');
					li.className = item.active ? 'active' : '';
					li.textContent = `${item.text}: ${item.value.toFixed(2)}`;
				}
				newMap.set(item.id, li);
				fragment.appendChild(li);
			}

			// Remove old items
			for (const li of state.itemMap.values()) {
				li.remove();
			}

			state.ul.replaceChildren(fragment);
			state.itemMap = newMap;
		}
	},
	destroy(state) {
		state.container.replaceChildren();
		state.ul = null;
		state.itemMap.clear();
	}
};

const melodicAdapter = {
	id: 'melodic',
	label: 'Melodic',
	create(container) {
		return { container };
	},
	render(state, items) {
		const template = melodicHtml`
			<ul>
				${melodicRepeat(
					items,
					(item) => item.id,
					(item) => melodicHtml`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
				)}
			</ul>
		`;
		melodicRender(template, state.container);
	},
	destroy(state) {
		state.container.replaceChildren();
		delete state.container.__parts;
	}
};

// Melodic with repeatRaw - bypasses template system for maximum performance
const melodicRawAdapter = {
	id: 'melodic-raw',
	label: 'Melodic Raw',
	create(container) {
		return { container };
	},
	render(state, items) {
		const template = melodicHtml`
			<ul>
				${melodicRepeatRaw(
					items,
					(item) => item.id,
					(item) => {
						const li = document.createElement('li');
						li.className = item.active ? 'active' : '';
						li.textContent = `${item.text}: ${item.value.toFixed(2)}`;
						return li;
					}
				)}
			</ul>
		`;
		melodicRender(template, state.container);
	},
	destroy(state) {
		state.container.replaceChildren();
		delete state.container.__parts;
	}
};

const reactAdapter = {
	id: 'react',
	label: 'React 18',
	create(container) {
		const root = createRoot(container);
		return { root, container };
	},
	render(state, items) {
		const children = items.map((item) =>
			React.createElement('li', { key: item.id, className: item.active ? 'active' : '' }, `${item.text}: ${item.value.toFixed(2)}`)
		);
		const element = React.createElement('ul', null, children);
		flushSync(() => state.root.render(element));
	},
	destroy(state) {
		state.root.unmount();
		state.container.replaceChildren();
	}
};

const preactAdapter = {
	id: 'preact',
	label: 'Preact',
	create(container) {
		return { container };
	},
	render(state, items) {
		const children = items.map((item) => preactH('li', { key: item.id, class: item.active ? 'active' : '' }, `${item.text}: ${item.value.toFixed(2)}`));
		preactRender(preactH('ul', null, children), state.container);
	},
	destroy(state) {
		preactRender(null, state.container);
		state.container.replaceChildren();
	}
};

const vueAdapter = {
	id: 'vue',
	label: 'Vue 3',
	create(container) {
		// Delay app creation and mounting until first render for fair comparison
		// Other frameworks don't have initialization overhead in create()
		return { container, app: null, items: null, mounted: false };
	},
	async render(state, items) {
		if (!state.mounted) {
			// First render - create and mount the app
			state.items = vueRef(items);
			state.app = createApp({
				setup() {
					return () =>
						vueH(
							'ul',
							state.items.value.map((item) => vueH('li', { key: item.id, class: item.active ? 'active' : '' }, `${item.text}: ${item.value.toFixed(2)}`))
						);
				}
			});
			state.app.mount(state.container);
			state.mounted = true;
			await vueNextTick();
		} else {
			// Subsequent renders - just update the ref
			state.items.value = items;
			await vueNextTick();
		}
	},
	destroy(state) {
		if (state.app) {
			state.app.unmount();
		}
		state.container.replaceChildren();
	}
};

const litAdapter = {
	id: 'lit',
	label: 'Lit',
	create(container) {
		return { container };
	},
	render(state, items) {
		const template = litHtml`
			<ul>
				${litRepeat(
					items,
					(item) => item.id,
					(item) => litHtml`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
				)}
			</ul>
		`;
		litRender(template, state.container);
	},
	destroy(state) {
		litRender(null, state.container);
		state.container.replaceChildren();
		delete state.container._$litPart$;
	}
};

const frameworks = [vanillaAdapter, melodicAdapter, melodicRawAdapter, reactAdapter, preactAdapter, vueAdapter, litAdapter];

const resultRows = new Map();
const containers = new Map();

// Store results for sorting
const results = new Map();
const testIds = ['initial', 'warm', 'update', 'partial', 'reorder', 'addRemove'];

const scoreCell = (cell, duration) => {
	if (duration < 10) {
		cell.classList.add('pass');
	} else if (duration < 25) {
		cell.classList.add('warn');
	} else {
		cell.classList.add('fail');
	}
};

const updateCell = (frameworkId, testId, duration) => {
	// Store result for later sorting
	if (!results.has(frameworkId)) {
		results.set(frameworkId, {});
	}
	results.get(frameworkId)[testId] = duration;

	const row = resultRows.get(frameworkId);
	if (!row) {
		return;
	}
	const cell = row.querySelector(`[data-test="${testId}"]`);
	if (!cell) {
		return;
	}
	cell.classList.remove('pass', 'warn', 'fail', 'rank-1', 'rank-2', 'rank-3');
	cell.textContent = `${duration.toFixed(2)} ms`;
	scoreCell(cell, duration);
};

const sortRowsByTest = (testId) => {
	// Get all framework results for this test
	const frameworkResults = [];
	for (const [frameworkId, testResults] of results.entries()) {
		if (testResults[testId] !== undefined) {
			frameworkResults.push({
				frameworkId,
				duration: testResults[testId]
			});
		}
	}

	// Sort by duration (fastest first)
	frameworkResults.sort((a, b) => a.duration - b.duration);

	// Add rank classes to cells
	frameworkResults.forEach((result, index) => {
		const row = resultRows.get(result.frameworkId);
		if (!row) return;
		const cell = row.querySelector(`[data-test="${testId}"]`);
		if (!cell) return;

		// Add rank indicator
		cell.classList.remove('rank-1', 'rank-2', 'rank-3');
		if (index === 0) {
			cell.classList.add('rank-1');
		} else if (index === 1) {
			cell.classList.add('rank-2');
		} else if (index === 2) {
			cell.classList.add('rank-3');
		}
	});

	return frameworkResults;
};

const reorderTableByOverall = () => {
	// Calculate total time for each framework
	const totals = [];
	for (const [frameworkId, testResults] of results.entries()) {
		const total = testIds.reduce((sum, testId) => sum + (testResults[testId] || 0), 0);
		totals.push({ frameworkId, total });
	}

	// Sort by total (fastest first)
	totals.sort((a, b) => a.total - b.total);

	// Reorder table rows
	totals.forEach(({ frameworkId }) => {
		const row = resultRows.get(frameworkId);
		if (row) {
			resultsTableBody.appendChild(row);
		}
	});

	// Add rank classes to each test column
	testIds.forEach((testId) => sortRowsByTest(testId));
};

const runInitialRender = async (framework) => {
	const state = framework.create(containers.get(framework.id));
	const items = generateItems(TEST_COUNT);
	const start = performance.now();
	await framework.render(state, items);
	await waitForPaint();
	const duration = performance.now() - start;
	framework.destroy(state);
	return duration;
};

const runWarmInitialRender = async (framework) => {
	const container = containers.get(framework.id);
	const warmState = framework.create(container);
	await framework.render(warmState, generateItems(TEST_COUNT));
	await waitForPaint();
	framework.destroy(warmState);

	const state = framework.create(container);
	const items = generateItems(TEST_COUNT);
	const start = performance.now();
	await framework.render(state, items);
	await waitForPaint();
	const duration = performance.now() - start;
	framework.destroy(state);
	return duration;
};

const runUpdateTest = async (framework, transform) => {
	const state = framework.create(containers.get(framework.id));
	const items = generateItems(TEST_COUNT);
	await framework.render(state, items);
	await waitForPaint();
	const updated = transform(items);
	const start = performance.now();
	await framework.render(state, updated);
	await waitForPaint();
	const duration = performance.now() - start;
	framework.destroy(state);
	return duration;
};

const runAll = async () => {
	// Clear previous results
	results.clear();

	for (const framework of frameworks) {
		const initial = await runInitialRender(framework);
		updateCell(framework.id, 'initial', initial);

		const warm = await runWarmInitialRender(framework);
		updateCell(framework.id, 'warm', warm);

		const update = await runUpdateTest(framework, updateItems);
		updateCell(framework.id, 'update', update);

		const partial = await runUpdateTest(framework, partialUpdateItems);
		updateCell(framework.id, 'partial', partial);

		const reorder = await runUpdateTest(framework, reorderItems);
		updateCell(framework.id, 'reorder', reorder);

		const addRemove = await runUpdateTest(framework, addRemoveItems);
		updateCell(framework.id, 'addRemove', addRemove);
	}

	// Sort and rank after all tests complete
	reorderTableByOverall();
};

const clearResults = () => {
	results.clear();
	resultRows.forEach((row) => {
		row.querySelectorAll('.result-cell').forEach((cell) => {
			cell.textContent = '';
			cell.classList.remove('pass', 'warn', 'fail', 'rank-1', 'rank-2', 'rank-3');
		});
	});
	containers.forEach((container) => {
		container.replaceChildren();
		delete container.__parts;
		delete container._$litPart$;
	});
};

frameworks.forEach((framework) => {
	resultRows.set(framework.id, createRow(framework));
	containers.set(framework.id, createContainerCard(framework));
});

document.getElementById('run-all').addEventListener('click', () => {
	runAll().catch((error) => {
		console.error('Benchmark run failed:', error);
	});
});

document.getElementById('clear').addEventListener('click', clearResults);
