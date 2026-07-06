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
