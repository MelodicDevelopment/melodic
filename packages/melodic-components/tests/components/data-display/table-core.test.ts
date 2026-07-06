import { describe, it, expect } from 'vitest';
import { TableCore, renderCell } from '../../../src/components/data-display/table-core';
import type { TableCoreHost, SortDirection } from '../../../src/components/data-display/table-core';
import { flush } from '../../helpers/component-test-utils';

/**
 * Unit tests for the shared ml-table / ml-data-grid core. These pin the
 * behavior both components now share, including the unifications made when
 * the fork was merged:
 *  - rows replacement recomputes the virtual window AFTER the new rows
 *    commit (data-grid behavior; ml-table previously recomputed against the
 *    stale dataset).
 *  - a component afterCommit hook (the grid's page clamp) runs before the
 *    window recompute.
 */

interface TestHost extends TableCoreHost {
	rows: Record<string, unknown>[];
	virtual: boolean;
}

function makeHost(rows: Record<string, unknown>[], overrides: Partial<TestHost> = {}): TestHost {
	return {
		elementRef: document.createElement('div'),
		rows,
		virtual: false,
		rowHeight: 44,
		sortKey: '',
		sortDirection: 'asc' as SortDirection,
		selectedIndices: [],
		startIndex: 0,
		endIndex: 50,
		...overrides
	};
}

/** Core whose display rows are the host rows passed through the core sort. */
function makeCore(host: TestHost): TableCore {
	const core: TableCore = new TableCore(host, {
		viewportSelector: '.vp',
		displayRows: () => core.sortRows(host.rows)
	});
	return core;
}

const people = [
	{ name: 'Charlie', age: 30 },
	{ name: 'Alice', age: 25 },
	{ name: 'Bob', age: 28 }
];

describe('TableCore.sortRows', () => {
	it('returns the input array untouched (same reference) when no sortKey is set', () => {
		const host = makeHost(people);
		const core = makeCore(host);
		expect(core.sortRows(host.rows)).toBe(host.rows);
	});

	it('sorts strings with locale compare and numbers numerically', () => {
		const host = makeHost(people, { sortKey: 'name' });
		const core = makeCore(host);
		expect(core.sortRows(host.rows).map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);

		host.sortKey = 'age';
		host.sortDirection = 'desc';
		expect(core.sortRows(host.rows).map(r => r.age)).toEqual([30, 28, 25]);
	});

	it('sorts null/undefined values last regardless of direction', () => {
		const rows = [{ v: null }, { v: 'b' }, {}, { v: 'a' }];
		const host = makeHost(rows as Record<string, unknown>[], { sortKey: 'v' });
		const core = makeCore(host);
		expect(core.sortRows(host.rows).map(r => r.v ?? '-')).toEqual(['a', 'b', '-', '-']);

		host.sortDirection = 'desc';
		expect(core.sortRows(host.rows).map(r => r.v ?? '-')).toEqual(['b', 'a', '-', '-']);
	});

	it('does not mutate the input array', () => {
		const host = makeHost([...people], { sortKey: 'name' });
		const core = makeCore(host);
		core.sortRows(host.rows);
		expect(host.rows[0].name).toBe('Charlie');
	});
});

describe('TableCore renderCell', () => {
	it('returns the raw value by default and blank for null/undefined', () => {
		expect(renderCell({ key: 'a' }, { a: 5 }, 0)).toBe(5);
		expect(renderCell({ key: 'a' }, { a: null }, 0)).toBe('');
		expect(renderCell({ key: 'a' }, {}, 0)).toBe('');
	});

	it('delegates to the column render callback with (value, row, index)', () => {
		const row = { a: 'x' };
		const args: unknown[] = [];
		const result = renderCell(
			{ key: 'a', render: (v, r, i) => { args.push(v, r, i); return 'custom'; } },
			row,
			7
		);
		expect(result).toBe('custom');
		expect(args).toEqual(['x', row, 7]);
	});
});

describe('TableCore.handleSortClick', () => {
	it('ignores non-sortable columns', () => {
		const host = makeHost(people);
		const core = makeCore(host);
		let sortFired = false;
		host.elementRef.addEventListener('ml:sort', () => { sortFired = true; });

		core.handleSortClick({ key: 'name' });
		expect(host.sortKey).toBe('');
		expect(sortFired).toBe(false);
	});

	it('cycles asc → desc on the active column and resets to asc on a new column', () => {
		const host = makeHost(people);
		const core = makeCore(host);

		core.handleSortClick({ key: 'name', sortable: true });
		expect(host.sortKey).toBe('name');
		expect(host.sortDirection).toBe('asc');

		core.handleSortClick({ key: 'name', sortable: true });
		expect(host.sortDirection).toBe('desc');

		core.handleSortClick({ key: 'age', sortable: true });
		expect(host.sortKey).toBe('age');
		expect(host.sortDirection).toBe('asc');
	});

	it('dispatches ml:sort with { key, direction } and runs beforeDispatch first', () => {
		const host = makeHost(people);
		const core = makeCore(host);
		const order: string[] = [];
		let detail: { key: string; direction: string } | null = null;
		host.elementRef.addEventListener('ml:sort', (e) => {
			order.push('event');
			detail = (e as CustomEvent).detail;
		});

		core.handleSortClick({ key: 'name', sortable: true }, () => order.push('hook'));

		expect(order).toEqual(['hook', 'event']);
		expect(detail).toEqual({ key: 'name', direction: 'asc' });
	});

	it('clears a non-empty selection and announces it via ml:select AFTER ml:sort', () => {
		const host = makeHost(people, { selectedIndices: [0, 1] });
		const core = makeCore(host);
		const order: string[] = [];
		let selectDetail: { selectedRows: unknown[]; selectedIndices: number[] } | null = null;
		host.elementRef.addEventListener('ml:sort', () => order.push('sort'));
		host.elementRef.addEventListener('ml:select', (e) => {
			order.push('select');
			selectDetail = (e as CustomEvent).detail;
		});

		core.handleSortClick({ key: 'name', sortable: true });

		expect(host.selectedIndices).toEqual([]);
		expect(order).toEqual(['sort', 'select']);
		expect(selectDetail).toEqual({ selectedRows: [], selectedIndices: [], allSelected: false });
	});

	it('does not emit ml:select when nothing was selected', () => {
		const host = makeHost(people);
		const core = makeCore(host);
		let selectFired = false;
		host.elementRef.addEventListener('ml:select', () => { selectFired = true; });

		core.handleSortClick({ key: 'name', sortable: true });
		expect(selectFired).toBe(false);
	});
});

describe('TableCore selection', () => {
	it('emitSelect maps display-order indices to row OBJECTS plus original-order indices', () => {
		// Sorted display order: Alice, Bob, Charlie. Display index 0 = Alice,
		// which is original index 1.
		const host = makeHost(people, { sortKey: 'name' });
		const core = makeCore(host);
		let detail: { selectedRows: unknown[]; selectedIndices: number[]; allSelected: boolean } | null = null;
		host.elementRef.addEventListener('ml:select', (e) => { detail = (e as CustomEvent).detail; });

		core.toggleSelectRow(0, new Event('change'));

		expect(host.selectedIndices).toEqual([0]);
		expect(detail!.selectedRows).toEqual([{ name: 'Alice', age: 25 }]);
		expect(detail!.selectedRows[0]).toBe(people[1]);
		expect(detail!.selectedIndices).toEqual([1]);
		expect(detail!.allSelected).toBe(false);
	});

	it('toggleSelectRow removes an already-selected index', () => {
		const host = makeHost(people, { selectedIndices: [0, 2] });
		const core = makeCore(host);

		core.toggleSelectRow(0, new Event('change'));
		expect(host.selectedIndices).toEqual([2]);
	});

	it('toggleSelectAll selects every display row, then clears on the second call', () => {
		const host = makeHost(people);
		const core = makeCore(host);
		const details: Array<{ allSelected: boolean; selectedRows: unknown[] }> = [];
		host.elementRef.addEventListener('ml:select', (e) => details.push((e as CustomEvent).detail));

		core.toggleSelectAll();
		expect(host.selectedIndices).toEqual([0, 1, 2]);
		expect(core.allSelected).toBe(true);
		expect(core.someSelected).toBe(false);
		expect(details[0].allSelected).toBe(true);
		expect(details[0].selectedRows).toHaveLength(3);

		core.toggleSelectAll();
		expect(host.selectedIndices).toEqual([]);
		expect(details[1].allSelected).toBe(false);
	});

	it('drops stale out-of-range indices from the emitted detail', () => {
		const host = makeHost(people, { selectedIndices: [1, 99] });
		const core = makeCore(host);
		let detail: { selectedRows: unknown[]; selectedIndices: number[] } | null = null;
		host.elementRef.addEventListener('ml:select', (e) => { detail = (e as CustomEvent).detail; });

		core.emitSelect();
		expect(detail!.selectedRows).toEqual([people[1]]);
		expect(detail!.selectedIndices).toEqual([1]);
	});

	it('clearSelection reports whether a selection was cleared', () => {
		const host = makeHost(people, { selectedIndices: [1] });
		const core = makeCore(host);

		expect(core.clearSelection()).toBe(true);
		expect(host.selectedIndices).toEqual([]);
		expect(core.clearSelection()).toBe(false);
	});
});

describe('TableCore virtual window', () => {
	it('computes spacer heights from the window and row height', () => {
		const host = makeHost(people, { virtual: true, startIndex: 10, endIndex: 20, rowHeight: 44 } as Partial<TestHost>);
		host.rows = Array.from({ length: 100 }, (_, i) => ({ i }));
		const core = makeCore(host);

		expect(core.topSpacerHeight).toBe(10 * 44);
		expect(core.bottomSpacerHeight).toBe((100 - 20) * 44);
		expect(core.visibleRows).toHaveLength(10);
		expect(core.visibleRows[0]).toEqual({ i: 10 });
	});

	it('returns zero spacers and all display rows when virtual is off', () => {
		const host = makeHost(people, { startIndex: 1, endIndex: 2 });
		const core = makeCore(host);

		expect(core.topSpacerHeight).toBe(0);
		expect(core.bottomSpacerHeight).toBe(0);
		expect(core.visibleRows).toHaveLength(3);
	});

	it('handleRowsChange clears selection synchronously and recomputes the window against the COMMITTED rows', async () => {
		const host = makeHost(Array.from({ length: 100 }, (_, i) => ({ i })), { selectedIndices: [3] });
		const core = makeCore(host);

		// Real viewport so the scroller can attach; virtual off → the scroller
		// reports the full committed row count as the window end.
		const shadow = host.elementRef.attachShadow({ mode: 'open' });
		const viewport = document.createElement('div');
		viewport.className = 'vp';
		shadow.appendChild(viewport);
		core.attachScroller();

		const afterCommitOrder: string[] = [];
		core.handleRowsChange(() => {
			afterCommitOrder.push(`clamp:endIndex=${host.endIndex}`);
		});
		// Selection reset is synchronous (the consumer initiated the change → no event).
		expect(host.selectedIndices).toEqual([]);

		// Simulate the framework committing the new value after onPropertyChange.
		host.rows = [{ i: 0 }, { i: 1 }];
		await flush();

		// afterCommit ran before the recompute, and the window used the new count.
		expect(afterCommitOrder).toHaveLength(1);
		expect(host.endIndex).toBe(2);
	});
});
