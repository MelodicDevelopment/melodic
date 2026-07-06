import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/data-grid/data-grid.component';
import type { DataGridColumn } from '../../../src/components/data-display/data-grid/data-grid.types';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQueryAll
} from '../../helpers/component-test-utils';

const columns: DataGridColumn[] = [
	{ key: 'id', label: 'ID', width: 80, pinned: 'left' },
	{ key: 'name', label: 'Name', width: 180, pinned: 'left' },
	{ key: 'email', label: 'Email', width: 220 },
	{ key: 'role', label: 'Role', width: 160 },
	{ key: 'year', label: 'Year', width: 120, pinned: 'right' },
	{ key: 'actions', label: '', width: 56, pinned: 'right' }
];

const rows = [
	{ id: 1, name: 'Alice', email: 'a@x', role: 'PM', year: 2024 },
	{ id: 2, name: 'Bob', email: 'b@x', role: 'Dev', year: 2025 }
];

describe('ml-data-grid pinned columns', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('positions right-pinned header cells side-by-side via inline right offsets', async () => {
		el = createComponent('ml-data-grid', { properties: { columns, rows, virtual: false } });
		await flush();

		const headers = shadowQueryAll<HTMLElement>(el, '.ml-data-grid__header-row .ml-data-grid__th--pinned-right');
		const yearHeader = headers.find(h => h.textContent?.includes('Year'))!;
		const actionsHeader = headers.find(h => h !== yearHeader)!;

		expect(yearHeader.getAttribute('style')).toContain('right: 56px');
		expect(actionsHeader.getAttribute('style')).toContain('right: 0px');
	});

	it('positions left-pinned header cells via inline left offsets', async () => {
		el = createComponent('ml-data-grid', { properties: { columns, rows, virtual: false } });
		await flush();

		const headers = shadowQueryAll<HTMLElement>(el, '.ml-data-grid__header-row .ml-data-grid__th--pinned-left');
		const idHeader = headers.find(h => h.textContent?.includes('ID'))!;
		const nameHeader = headers.find(h => h.textContent?.includes('Name'))!;

		expect(idHeader.getAttribute('style')).toContain('left: 0px');
		expect(nameHeader.getAttribute('style')).toContain('left: 80px');
	});

	it('shifts left-pinned offsets by 44px when selectable', async () => {
		el = createComponent('ml-data-grid', { properties: { columns, rows, virtual: false, selectable: true } });
		await flush();

		const headers = shadowQueryAll<HTMLElement>(el, '.ml-data-grid__header-row .ml-data-grid__th--pinned-left');
		const idHeader = headers.find(h => h.textContent?.includes('ID'))!;
		const nameHeader = headers.find(h => h.textContent?.includes('Name'))!;

		expect(idHeader.getAttribute('style')).toContain('left: 44px');
		expect(nameHeader.getAttribute('style')).toContain(`left: ${44 + 80}px`);
	});

	it('exposes boundary keys for shadow rendering', async () => {
		el = createComponent('ml-data-grid', { properties: { columns, rows, virtual: false } });
		await flush();

		expect(el.lastLeftPinnedKey).toBe('name');
		expect(el.firstRightPinnedKey).toBe('year');
	});

	it('returns null boundary keys when no columns are pinned on that side', async () => {
		el = createComponent('ml-data-grid', {
			properties: { columns: [{ key: 'a', label: 'A', width: 100 }], rows: [], virtual: false }
		});
		await flush();

		expect(el.lastLeftPinnedKey).toBeNull();
		expect(el.firstRightPinnedKey).toBeNull();
	});

	it('applies inline right: Npx styles to right-pinned header cells', async () => {
		el = createComponent('ml-data-grid', { properties: { columns, rows, virtual: false } });
		await flush();

		const headerCells = shadowQueryAll<HTMLElement>(el, '.ml-data-grid__header-row .ml-data-grid__th--pinned-right');
		// Two right-pinned columns: year (offset 56) and actions (offset 0)
		expect(headerCells).toHaveLength(2);
		const styles = headerCells.map(c => c.getAttribute('style') ?? '');
		expect(styles.some(s => s.includes('right: 56px'))).toBe(true);
		expect(styles.some(s => s.includes('right: 0px'))).toBe(true);
	});

	it('only puts the edge class on boundary cells, not on every pinned cell', async () => {
		el = createComponent('ml-data-grid', { properties: { columns, rows, virtual: false } });
		await flush();

		const leftEdgeHeaders = shadowQueryAll(el, '.ml-data-grid__th--pinned-left-edge');
		const rightEdgeHeaders = shadowQueryAll(el, '.ml-data-grid__th--pinned-right-edge');

		// 2 left-pinned columns but only 1 edge; 2 right-pinned but only 1 edge.
		expect(leftEdgeHeaders).toHaveLength(1);
		expect(rightEdgeHeaders).toHaveLength(1);
	});

	it('applies edge classes to body cells too', async () => {
		el = createComponent('ml-data-grid', { properties: { columns, rows, virtual: false } });
		await flush();

		// 2 rows × 1 edge cell per side
		expect(shadowQueryAll(el, '.ml-data-grid__td--pinned-left-edge')).toHaveLength(2);
		expect(shadowQueryAll(el, '.ml-data-grid__td--pinned-right-edge')).toHaveLength(2);
	});
});

describe('ml-data-grid page clamping', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	const manyRows = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));
	const gridColumns: DataGridColumn[] = [
		{ key: 'id', label: 'ID' },
		{ key: 'name', label: 'Name' }
	];

	it('clamps currentPage when rows shrink externally', async () => {
		el = createComponent('ml-data-grid', {
			properties: { columns: gridColumns, rows: manyRows, pageSize: 10, virtual: false }
		});
		await flush();

		el.component.goToPage(3);
		expect(el.currentPage).toBe(3);

		// External replacement with a smaller dataset — page must not stay at 3 of 1.
		el.rows = manyRows.slice(0, 5);
		await flush();
		await flush();

		expect(el.totalPages).toBe(1);
		expect(el.currentPage).toBe(1);
		expect(el.processedRows).toHaveLength(5);
	});

	it('keeps currentPage when it is still valid after rows change', async () => {
		el = createComponent('ml-data-grid', {
			properties: { columns: gridColumns, rows: manyRows, pageSize: 10, virtual: false }
		});
		await flush();

		el.component.goToPage(2);
		el.rows = manyRows.slice(0, 25); // still 3 pages
		await flush();
		await flush();

		expect(el.currentPage).toBe(2);
	});
});

describe('ml-data-grid resize handle vs sort', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	const sortableColumns: DataGridColumn[] = [
		{ key: 'id', label: 'ID', sortable: true, resizable: true },
		{ key: 'name', label: 'Name', sortable: true, resizable: true }
	];

	it('clicking the resize handle does not trigger a sort', async () => {
		el = createComponent('ml-data-grid', {
			properties: { columns: sortableColumns, rows, virtual: false }
		});
		await flush();

		const handle = el.shadowRoot?.querySelector('.ml-data-grid__resize-handle') as HTMLElement;
		expect(handle).toBeTruthy();
		handle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();

		expect(el.sortKey).toBe('');
	});

	it('clicking the header itself still sorts', async () => {
		el = createComponent('ml-data-grid', {
			properties: { columns: sortableColumns, rows, virtual: false }
		});
		await flush();

		const th = el.shadowRoot?.querySelector('.ml-data-grid__th--sortable') as HTMLElement;
		th.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();

		expect(el.sortKey).toBe('id');
	});
});

describe('ml-data-grid ml:select contract', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	const gridColumns: DataGridColumn[] = [
		{ key: 'id', label: 'ID', sortable: true },
		{ key: 'name', label: 'Name' }
	];
	const gridRows = [
		{ id: 3, name: 'Charlie' },
		{ id: 1, name: 'Alice' },
		{ id: 2, name: 'Bob' }
	];

	it('emits row objects and original-order indices under an active sort', async () => {
		el = createComponent('ml-data-grid', {
			properties: {
				columns: gridColumns,
				rows: gridRows,
				selectable: true,
				virtual: false,
				sortKey: 'id',
				sortDirection: 'asc'
			}
		});
		await flush();

		const detail = await new Promise<any>((resolve) => {
			el.addEventListener('ml:select', (e: CustomEvent) => resolve(e.detail), { once: true });
			// First rendered row under id-asc sort is Alice (original index 1).
			const checkbox = el.shadowRoot?.querySelector('.ml-data-grid__row .ml-data-grid__checkbox') as HTMLInputElement;
			checkbox.dispatchEvent(new Event('change'));
		});

		expect(detail.selectedRows).toEqual([{ id: 1, name: 'Alice' }]);
		expect(detail.selectedRows[0]).toBe(gridRows[1]);
		expect(detail.selectedIndices).toEqual([1]);
	});

	it('emits an empty ml:select when sorting clears a non-empty selection', async () => {
		el = createComponent('ml-data-grid', {
			properties: { columns: gridColumns, rows: gridRows, selectable: true, virtual: false }
		});
		await flush();

		const checkbox = el.shadowRoot?.querySelector('.ml-data-grid__row .ml-data-grid__checkbox') as HTMLInputElement;
		checkbox.dispatchEvent(new Event('change'));
		expect(el.selectedIndices).toEqual([0]);

		const detail = await new Promise<any>((resolve) => {
			el.addEventListener('ml:select', (e: CustomEvent) => resolve(e.detail), { once: true });
			const th = el.shadowRoot?.querySelector('.ml-data-grid__th--sortable') as HTMLElement;
			th.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		});

		expect(detail.selectedRows).toEqual([]);
		expect(detail.selectedIndices).toEqual([]);
	});
});
