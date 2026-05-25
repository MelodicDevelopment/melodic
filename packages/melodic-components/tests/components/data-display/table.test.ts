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
