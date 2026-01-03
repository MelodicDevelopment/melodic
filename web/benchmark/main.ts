import { html, render, repeat } from '../../src/template';
import './styles.css';

type BenchmarkKey = 'initial' | 'update' | 'partial' | 'reorder' | 'add-remove';

type BenchResult = {
	label: string;
	duration: number;
	status: 'pass' | 'warn' | 'fail';
	message: string;
};

const container = document.getElementById('benchmark-container') as HTMLElement;

const generateItems = (count: number) =>
	Array.from({ length: count }, (_, i) => ({
		id: i,
		text: `Item ${i}`,
		value: Math.random(),
		active: i % 2 === 0
	}));

const resetContainer = () => {
	container.innerHTML = '';
	delete (container as any).__parts;
};

const renderList = (items: Array<{ id: number; text: string; value: number; active: boolean }>) =>
	html`
		<ul>
			${repeat(
				items,
				(item) => item.id,
				(item) => html`<li class="${item.active ? 'active' : ''}">${item.text}: ${item.value.toFixed(2)}</li>`
			)}
		</ul>
	`;

const classifyResult = (duration: number, warnAt: number, failAt: number) => {
	if (duration <= warnAt) return 'pass';
	if (duration <= failAt) return 'warn';
	return 'fail';
};

const setResult = (key: BenchmarkKey, result: BenchResult) => {
	const node = document.querySelector(`[data-result="${key}"]`) as HTMLElement | null;
	if (!node) return;

	node.classList.remove('pass', 'warn', 'fail');
	node.classList.add(result.status);
	node.innerHTML = `
		<strong>${result.label}: ${result.duration.toFixed(2)}ms</strong><br />
		<span>${result.message}</span>
	`;
};

const clearResults = () => {
	for (const node of document.querySelectorAll('.bench-result')) {
		node.classList.remove('pass', 'warn', 'fail');
		node.textContent = '';
	}
};

const runInitial = () => {
	resetContainer();
	const items = generateItems(1000);

	const start = performance.now();
	render(renderList(items), container);
	const duration = performance.now() - start;

	setResult('initial', {
		label: 'Initial render (1000)',
		duration,
		status: classifyResult(duration, 40, 80),
		message: 'Target: <40ms excellent, <80ms solid.'
	});
};

const runUpdate = async () => {
	resetContainer();
	let items = generateItems(1000);

	render(renderList(items), container);
	await new Promise((resolve) => setTimeout(resolve, 0));

	items = items.map((item) => ({ ...item, value: Math.random(), active: !item.active }));

	const start = performance.now();
	render(renderList(items), container);
	const duration = performance.now() - start;

	setResult('update', {
		label: 'Full update (1000)',
		duration,
		status: classifyResult(duration, 30, 60),
		message: 'Target: <30ms excellent, <60ms solid.'
	});
};

const runPartial = async () => {
	resetContainer();
	let items = generateItems(1000);

	render(renderList(items), container);
	await new Promise((resolve) => setTimeout(resolve, 0));

	items = items.map((item, index) =>
		index % 100 === 0 ? { ...item, value: Math.random(), active: !item.active } : item
	);

	const start = performance.now();
	render(renderList(items), container);
	const duration = performance.now() - start;

	setResult('partial', {
		label: 'Partial update (10)',
		duration,
		status: classifyResult(duration, 8, 16),
		message: 'Target: <8ms excellent, <16ms solid.'
	});
};

const runReorder = async () => {
	resetContainer();
	let items = generateItems(1000);

	render(renderList(items), container);
	await new Promise((resolve) => setTimeout(resolve, 0));

	items = [...items].reverse();

	const start = performance.now();
	render(renderList(items), container);
	const duration = performance.now() - start;

	setResult('reorder', {
		label: 'Reorder (1000)',
		duration,
		status: classifyResult(duration, 25, 50),
		message: 'Target: <25ms excellent, <50ms solid.'
	});
};

const runAddRemove = async () => {
	resetContainer();
	let items = generateItems(1000);

	render(renderList(items), container);
	await new Promise((resolve) => setTimeout(resolve, 0));

	items = items.concat(generateItems(200).map((item) => ({ ...item, id: item.id + 1000 })));
	items = items.slice(0, 1000);

	const start = performance.now();
	render(renderList(items), container);
	const duration = performance.now() - start;

	setResult('add-remove', {
		label: 'Add / remove (200)',
		duration,
		status: classifyResult(duration, 30, 60),
		message: 'Target: <30ms excellent, <60ms solid.'
	});
};

const tests: Record<BenchmarkKey, () => void | Promise<void>> = {
	initial: runInitial,
	update: runUpdate,
	partial: runPartial,
	reorder: runReorder,
	'add-remove': runAddRemove
};

const runAll = async () => {
	for (const key of Object.keys(tests) as BenchmarkKey[]) {
		await tests[key]();
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
};

const benchRunAll = document.getElementById('bench-run-all');
const benchClear = document.getElementById('bench-clear');

benchRunAll?.addEventListener('click', () => void runAll());
benchClear?.addEventListener('click', () => clearResults());

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-bench]')) {
	button.addEventListener('click', () => {
		const key = button.dataset.bench as BenchmarkKey | undefined;
		if (!key) return;
		void tests[key]();
	});
}
