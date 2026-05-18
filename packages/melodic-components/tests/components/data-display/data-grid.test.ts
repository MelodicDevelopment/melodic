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
