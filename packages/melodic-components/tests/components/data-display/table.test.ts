import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/data-display/table/table.component';
import type { TableColumn } from '../../../src/components/data-display/table/table.types';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	shadowQueryAll,
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

describe('ml-table rowHref', () => {
	let el: any;
	let originalPath: string;

	afterEach(() => {
		if (el) removeComponent(el);
		if (originalPath !== undefined) {
			window.history.replaceState({}, '', originalPath);
		}
	});

	const personRows = [
		{ personID: 1, name: 'Alice' },
		{ personID: 2, name: 'Bob' },
		{ personID: 3, name: 'Charlie' }
	];

	it('renders no overlay anchors when rowHref is unset', async () => {
		el = createComponent('ml-table', {
			properties: { columns, rows: personRows }
		});
		await flush();
		const anchors = shadowQueryAll(el, '.ml-table__row-link');
		expect(anchors.length).toBe(0);
	});

	it('renders an overlay anchor per visible row with the mapped href', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();
		const anchors = shadowQueryAll<HTMLAnchorElement>(el, '.ml-table__row-link');
		expect(anchors.length).toBe(3);
		expect(anchors[0].getAttribute('href')).toBe('/people/1');
		expect(anchors[1].getAttribute('href')).toBe('/people/2');
		expect(anchors[2].getAttribute('href')).toBe('/people/3');
	});

	it('plain left-click on a same-origin anchor calls preventDefault and pushes history', async () => {
		originalPath = window.location.pathname + window.location.search;
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();
		const anchor = shadowQuery<HTMLAnchorElement>(el, '.ml-table__row-link')!;
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		anchor.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(window.location.pathname).toBe('/people/1');
	});

	it('plain left-click on an external URL does NOT preventDefault (anchor navigates natively)', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `https://other-site.example.com/people/${row.personID}`
			}
		});
		await flush();
		const anchor = shadowQuery<HTMLAnchorElement>(el, '.ml-table__row-link')!;
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		anchor.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});

	it('plain left-click on a mailto: URL does NOT preventDefault', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: () => 'mailto:hello@example.com'
			}
		});
		await flush();
		const anchor = shadowQuery<HTMLAnchorElement>(el, '.ml-table__row-link')!;
		const event = new MouseEvent('click', { bubbles: true, cancelable: true });
		anchor.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});

	it('cmd-click on the overlay anchor does NOT preventDefault (browser handles new tab)', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();
		const anchor = shadowQuery<HTMLAnchorElement>(el, '.ml-table__row-link')!;
		const event = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
		anchor.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});

	it('ctrl-click on the overlay anchor does NOT preventDefault', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();
		const anchor = shadowQuery<HTMLAnchorElement>(el, '.ml-table__row-link')!;
		const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
		anchor.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});

	it('suppresses ml:row-click on modifier-click (does not double-fire alongside the new-tab navigation)', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();

		let rowClickFired = false;
		el.addEventListener('ml:row-click', () => { rowClickFired = true; });

		const anchor = shadowQuery<HTMLAnchorElement>(el, '.ml-table__row-link')!;
		anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }));
		await flush();
		expect(rowClickFired).toBe(false);
	});

	it('still fires ml:row-click on plain left-click as a side-effect hook', async () => {
		originalPath = window.location.pathname + window.location.search;
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();

		const eventPromise = captureEvent<{ row: Record<string, unknown>; index: number }>(el, 'ml:row-click');
		const anchor = shadowQuery<HTMLAnchorElement>(el, '.ml-table__row-link')!;
		anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

		const event = await eventPromise;
		expect(event.detail.index).toBe(0);
		expect((event.detail.row as { personID: number }).personID).toBe(1);
	});

	it('reflects rowHref into the row-linkable class on the table host element', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();
		expect(shadowQuery(el, '.ml-table.ml-table--row-linkable')).not.toBeNull();
	});

	it('does not include row-linkable class when rowHref is unset', async () => {
		el = createComponent('ml-table', {
			properties: { columns, rows: personRows }
		});
		await flush();
		expect(shadowQuery(el, '.ml-table.ml-table--row-linkable')).toBeNull();
	});

	it('marks overlay anchors as aria-hidden so screen readers skip them', async () => {
		el = createComponent('ml-table', {
			properties: {
				columns,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();
		const anchors = shadowQueryAll<HTMLAnchorElement>(el, '.ml-table__row-link');
		expect(anchors.length).toBe(3);
		anchors.forEach(a => {
			expect(a.getAttribute('aria-hidden')).toBe('true');
			expect(a.getAttribute('tabindex')).toBe('-1');
		});
	});

	it('cell content that opts into custom render still receives its own clicks when rowHref is set', async () => {
		const columnsWithRender: TableColumn[] = [
			{
				key: 'name',
				label: 'Name',
				render: () => {
					const btn = document.createElement('button');
					btn.className = 'cell-action';
					btn.textContent = 'Action';
					btn.addEventListener('click', (e) => {
						e.stopPropagation();
						(btn as any)._clicked = true;
					});
					return btn;
				}
			}
		];

		el = createComponent('ml-table', {
			properties: {
				columns: columnsWithRender,
				rows: personRows,
				rowHref: (row: Record<string, unknown>) => `/people/${row.personID}`
			}
		});
		await flush();

		let rowClickCount = 0;
		el.addEventListener('ml:row-click', () => { rowClickCount++; });

		const btn = shadowQuery<HTMLButtonElement>(el, 'button.cell-action')!;
		expect(btn).not.toBeNull();
		btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await flush();

		expect((btn as any)._clicked).toBe(true);
		// Button stopped propagation, so the row's click handler did not fire ml:row-click.
		expect(rowClickCount).toBe(0);
	});
});
