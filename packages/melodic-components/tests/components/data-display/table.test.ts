import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/table/table.component';
import type { TableColumn } from '../../../src/components/data-display/table/table.types';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	captureEvent
} from '../../helpers/component-test-utils';

const columns: TableColumn[] = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'age', label: 'Age', sortable: true }
];

// Server returns these in a deliberately non-alphabetical order to prove
// the component does not re-sort them when manualSort is on.
const serverOrderedRows = [
	{ name: 'Charlie', age: 30 },
	{ name: 'Alice', age: 25 },
	{ name: 'Bob', age: 28 }
];

describe('ml-table manualSort', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('returns rows untouched when manualSort is true regardless of sortKey', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: serverOrderedRows,
				manualSort: true,
				sortKey: 'name',
				sortDirection: 'asc'
			}
		});
		await flush();
		expect(el.sortedRows).toEqual(serverOrderedRows);
		expect(el.sortedRows[0].name).toBe('Charlie');
	});

	it('still sorts client-side when manualSort is false (default)', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: serverOrderedRows,
				sortKey: 'name',
				sortDirection: 'asc'
			}
		});
		await flush();
		expect(el.sortedRows.map((r: any) => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
	});

	it('still fires ml:sort when a sortable header is clicked in manual-sort mode', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: serverOrderedRows,
				manualSort: true
			}
		});
		await flush();

		const eventPromise = captureEvent<{ key: string; direction: string }>(el, 'ml:sort');
		const headers = el.shadowRoot?.querySelectorAll('th.ml-table__th--sortable');
		const nameHeader = headers?.[0] as HTMLElement;
		expect(nameHeader).toBeTruthy();
		nameHeader.click();

		const event = await eventPromise;
		expect(event.detail.key).toBe('name');
		expect(event.detail.direction).toBe('asc');
		// rows order remains untouched
		expect(el.sortedRows).toEqual(serverOrderedRows);
	});

	it('reflects the manual-sort attribute onto the manualSort property', async () => {
		el = createComponent('ml-table', {
			attributes: { 'manual-sort': '' },
			properties: { columns, rows: serverOrderedRows, sortKey: 'name', sortDirection: 'asc' }
		});
		await flush();
		expect(el.manualSort).toBe(true);
		expect(el.sortedRows).toEqual(serverOrderedRows);
	});
});

describe('ml-table sortedRows (default)', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('returns rows untouched when no sortKey is set', async () => {
		el = createComponent('ml-table', {
			properties: { columns, rows: serverOrderedRows }
		});
		await flush();
		expect(el.sortedRows).toEqual(serverOrderedRows);
	});
});

describe('ml-table selection', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	function rowCheckboxes(): HTMLInputElement[] {
		return Array.from(el.shadowRoot?.querySelectorAll('tbody .ml-table__checkbox') ?? []);
	}

	it('resets selection when rows are replaced', async () => {
		el = createComponent('ml-table', {
			properties: { columns, rows: serverOrderedRows, selectable: true }
		});
		await flush();

		rowCheckboxes()[0].dispatchEvent(new Event('change'));
		expect(el.selectedIndices).toEqual([0]);

		el.rows = [{ name: 'Dana', age: 40 }];
		await flush();
		expect(el.selectedIndices).toEqual([]);
	});

	it('emits selected ROW OBJECTS plus original-order indices, not sorted positions', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: serverOrderedRows,
				selectable: true,
				sortKey: 'name',
				sortDirection: 'asc'
			}
		});
		await flush();

		// Sorted order: Alice, Bob, Charlie. Select the first VISIBLE row (Alice),
		// which is index 1 in the consumer's original array.
		const eventPromise = captureEvent<{
			selectedRows: Record<string, unknown>[];
			selectedIndices: number[];
			allSelected: boolean;
		}>(el, 'ml:select');
		rowCheckboxes()[0].dispatchEvent(new Event('change'));

		const event = await eventPromise;
		expect(event.detail.selectedRows).toEqual([{ name: 'Alice', age: 25 }]);
		expect(event.detail.selectedRows[0]).toBe(serverOrderedRows[1]);
		expect(event.detail.selectedIndices).toEqual([1]);
		expect(event.detail.allSelected).toBe(false);
	});

	it('select-all emits every row object with original-order indices', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: serverOrderedRows,
				selectable: true,
				sortKey: 'name',
				sortDirection: 'asc'
			}
		});
		await flush();

		const eventPromise = captureEvent<{
			selectedRows: Record<string, unknown>[];
			selectedIndices: number[];
			allSelected: boolean;
		}>(el, 'ml:select');
		const headerCheckbox = el.shadowRoot?.querySelector('thead .ml-table__checkbox') as HTMLInputElement;
		headerCheckbox.dispatchEvent(new Event('change'));

		const event = await eventPromise;
		expect(event.detail.allSelected).toBe(true);
		expect(event.detail.selectedRows).toHaveLength(3);
		// Every original row is present, and indices point into the original array.
		for (let i = 0; i < event.detail.selectedRows.length; i++) {
			const row = event.detail.selectedRows[i];
			expect(serverOrderedRows[event.detail.selectedIndices[i]]).toBe(row);
		}
	});

	it('emits ml:select (empty) when sorting clears a non-empty selection', async () => {
		el = createComponent('ml-table', {
			properties: { columns, rows: serverOrderedRows, selectable: true }
		});
		await flush();

		rowCheckboxes()[0].dispatchEvent(new Event('change'));
		expect(el.selectedIndices).toEqual([0]);

		const selectPromise = captureEvent<{ selectedRows: unknown[]; selectedIndices: number[] }>(el, 'ml:select');
		const header = el.shadowRoot?.querySelector('th.ml-table__th--sortable') as HTMLElement;
		header.click();

		const event = await selectPromise;
		expect(event.detail.selectedRows).toEqual([]);
		expect(event.detail.selectedIndices).toEqual([]);
		expect(el.selectedIndices).toEqual([]);
	});

	it('does not emit ml:select when sorting with nothing selected', async () => {
		el = createComponent('ml-table', {
			properties: { columns, rows: serverOrderedRows, selectable: true }
		});
		await flush();

		let selectFired = false;
		el.addEventListener('ml:select', () => { selectFired = true; });
		const header = el.shadowRoot?.querySelector('th.ml-table__th--sortable') as HTMLElement;
		header.click();
		await flush();
		expect(selectFired).toBe(false);
	});
});

describe('ml-table rowKey', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	const people = [
		{ id: 'c', name: 'Charlie', age: 30 },
		{ id: 'a', name: 'Alice', age: 25 },
		{ id: 'b', name: 'Bob', age: 28 }
	];

	function rowEls(): HTMLElement[] {
		return Array.from(el.shadowRoot.querySelectorAll('.ml-table__row'));
	}

	it('keeps each record on its own row element across a sort when rowKey is set', async () => {
		el = createComponent('ml-table', { properties: { columns, rows: people, rowKey: 'id' } });
		await flush();

		const before = rowEls();
		const charlieEl = before.find((r) => r.textContent!.includes('Charlie'))!;
		expect(before[0]).toBe(charlieEl);

		el.sortKey = 'name';
		await flush();

		const after = rowEls();
		expect(after.map((r) => r.textContent!.replace(/\s+/g, ' ').trim().split(' ')[0])).toEqual(['Alice', 'Bob', 'Charlie']);
		// Same DOM node, moved — not row 0's node re-filled with another record.
		expect(after[2]).toBe(charlieEl);
	});

	it('accepts the row-key attribute and a function', async () => {
		el = createComponent('ml-table', { attributes: { 'row-key': 'id' }, properties: { columns, rows: people } });
		await flush();
		expect(el.rowKey).toBe('id');
		expect(el.component.getRowKey(people[1], 1)).toBe('a');

		el.rowKey = (row: any) => `k-${row.id}`;
		expect(el.component.getRowKey(people[1], 1)).toBe('k-a');
	});

	it('still keys rows by position without a rowKey', async () => {
		el = createComponent('ml-table', { properties: { columns, rows: people } });
		await flush();
		expect(el.component.getRowKey(people[1], 1)).toBe(1);
	});
});

describe('ml-table keyboard and semantics', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	it('makes clickable rows tab stops that activate with Enter and Space', async () => {
		el = createComponent('ml-table', { attributes: { 'clickable-rows': '' }, properties: { columns, rows: serverOrderedRows } });
		await flush();

		const row = el.shadowRoot.querySelectorAll('.ml-table__row')[1] as HTMLElement;
		expect(row.getAttribute('tabindex')).toBe('0');

		for (const key of ['Enter', ' ']) {
			const clicked = captureEvent<{ row: any; index: number }>(el, 'ml:row-click');
			const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
			row.dispatchEvent(event);
			const { detail } = await clicked;
			expect(detail.row).toBe(serverOrderedRows[1]);
			expect(detail.index).toBe(1);
			expect(event.defaultPrevented).toBe(true);
		}
	});

	it('does not make rows focusable, or react to keys, without clickable-rows', async () => {
		el = createComponent('ml-table', { properties: { columns, rows: serverOrderedRows } });
		await flush();

		const row = el.shadowRoot.querySelector('.ml-table__row') as HTMLElement;
		expect(row.hasAttribute('tabindex')).toBe(false);

		let fired = false;
		el.addEventListener('ml:row-click', () => (fired = true));
		row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
		expect(fired).toBe(false);
	});

	it('ignores keys pressed inside a cell control', async () => {
		el = createComponent('ml-table', { attributes: { 'clickable-rows': '', selectable: '' }, properties: { columns, rows: serverOrderedRows } });
		await flush();

		let fired = false;
		el.addEventListener('ml:row-click', () => (fired = true));
		const checkbox = el.shadowRoot.querySelector('.ml-table__row .ml-table__checkbox') as HTMLElement;
		checkbox.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
		expect(fired).toBe(false);
	});

	it('does not claim role="grid" (there is no cell navigation)', async () => {
		el = createComponent('ml-table', { properties: { columns, rows: serverOrderedRows } });
		await flush();
		expect(el.shadowRoot.querySelector('table').hasAttribute('role')).toBe(false);
	});
});
