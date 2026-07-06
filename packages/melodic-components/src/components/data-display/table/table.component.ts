import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender, OnPropertyChange } from '@melodicdev/core';
import type { TableColumn, SortDirection } from './table.types.js';
import { tableTemplate } from './table.template.js';
import { tableStyles } from './table.styles.js';
import { TableCore } from '../table-core/index.js';

/**
 * ml-table - Data table with sorting, selection, and custom cell rendering
 *
 * @example
 * ```html
 * <ml-table .columns=${columns} .rows=${rows} striped hoverable></ml-table>
 *
 * <!-- Server-paginated: parent handles ordering -->
 * <ml-table
 *     manual-sort
 *     .columns=${columns}
 *     .rows=${pageRows}
 *     .sortKey=${sortKey}
 *     .sortDirection=${sortDirection}
 *     @ml:sort=${handleSort}
 * ></ml-table>
 * ```
 *
 * @fires ml:sort - Emitted when a sortable column header is clicked. Detail: { key, direction }
 * @fires ml:select - Emitted when row selection changes (including when sorting clears a
 *   non-empty selection). Detail: { selectedRows, selectedIndices, allSelected } where
 *   `selectedRows` contains the selected row OBJECTS and `selectedIndices` their indices
 *   in the original `rows` array (consumer order, independent of the current sort).
 *   BREAKING (2.x): `selectedRows` previously contained sorted-order indices.
 * @fires ml:row-click - Emitted when a row is clicked. Detail: { row, index }
 *
 * @slot footer - Content for the table footer area (e.g. pagination)
 * @slot header-actions - Actions placed in the header next to title/description
 */
@MelodicComponent({
	selector: 'ml-table',
	template: tableTemplate,
	styles: tableStyles,
	attributes: ['selectable', 'striped', 'hoverable', 'size', 'table-title', 'description', 'sticky-header', 'virtual', 'manual-sort', 'clickable-rows']
})
export class TableComponent implements IElementRef, OnCreate, OnDestroy, OnRender, OnPropertyChange {
	public elementRef!: HTMLElement;

	/**
	 * Apply the clickable-row affordance (pointer cursor + hover highlight).
	 * Set this when you also listen for `ml:row-click`. Replaces the previous
	 * auto-detection that globally patched EventTarget.prototype.addEventListener.
	 */
	public clickableRows = false;

	/** Whether the footer slot has content */
	public hasFooter = false;

	/** Whether the header-actions slot has content */
	public hasHeaderActions = false;

	/** Enable row selection via checkboxes */
	public selectable = false;

	/** Alternating row backgrounds */
	public striped = false;

	/** Highlight rows on hover */
	public hoverable = true;

	/** Sticky table header */
	public stickyHeader = false;

	/** Table size */
	public size: 'sm' | 'md' = 'md';

	/** Table header title */
	public tableTitle = '';

	/** Table header description */
	public description = '';

	/** Enable virtual scrolling (renders only visible rows) */
	public virtual = false;

	/**
	 * Opt out of client-side row sorting. When true, `rows` is rendered in the
	 * order provided and `sortedRows` returns it untouched, but `sortKey` /
	 * `sortDirection` still update on header clicks and `ml:sort` still fires
	 * so the consumer can re-query the server with the new ordering.
	 */
	public manualSort = false;

	/** Column definitions */
	public columns: TableColumn[] = [];

	/** Row data */
	public rows: Record<string, unknown>[] = [];

	/** Currently sorted column key */
	public sortKey = '';

	/** Current sort direction */
	public sortDirection: SortDirection = 'asc';

	/** Indices of selected rows */
	public selectedIndices: number[] = [];

	// ── Virtual scroll state ─────────────────────────────────────────────────────

	public startIndex = 0;
	public endIndex = 50;

	// ── Private ──────────────────────────────────────────────────────────────────

	/** Shared table pipeline: sorting, selection, ml:* events, virtual window. */
	private _core = new TableCore(this, {
		viewportSelector: '.ml-table__wrapper',
		displayRows: () => this.sortedRows
	});

	// ── Row height by size ────────────────────────────────────────────────────────

	public get rowHeight(): number {
		return this.size === 'sm' ? 36 : 44;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────────

	public onPropertyChange(name: string, _oldVal: unknown, _newVal: unknown): void {
		if (name === 'columns') {
			this._core.invalidateScroller();
		}

		if (name === 'rows') {
			// Selection is positional; a new dataset invalidates it. Reset silently
			// (the consumer initiated the change) and recompute the virtual window
			// after the new value commits — same behavior as ml-data-grid.
			this._core.handleRowsChange();
		}
	}

	public onCreate(): void {
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		shadow.querySelectorAll('slot').forEach(slot => {
			slot.addEventListener('slotchange', () => {
				const name = slot.getAttribute('name');
				if (name === 'footer') {
					this.hasFooter = slot.assignedNodes().length > 0;
				} else if (name === 'header-actions') {
					this.hasHeaderActions = slot.assignedNodes().length > 0;
				}
			});
		});
		this._core.attachScroller();
	}

	public onRender(): void {
		this._core.syncRenderWindow();
	}

	public onDestroy(): void {
		this._core.detach();
	}

	// ── Data ──────────────────────────────────────────────────────────────────────

	/** Rows sorted by current sort key/direction */
	public get sortedRows(): Record<string, unknown>[] {
		if (this.manualSort) return this.rows;
		return this._core.sortRows(this.rows);
	}

	public get visibleRows(): Record<string, unknown>[] {
		return this._core.visibleRows;
	}

	public get topSpacerHeight(): number {
		return this._core.topSpacerHeight;
	}

	public get bottomSpacerHeight(): number {
		return this._core.bottomSpacerHeight;
	}

	public get colCount(): number {
		return this.columns.length + (this.selectable ? 1 : 0);
	}

	public get allSelected(): boolean {
		return this._core.allSelected;
	}

	public get someSelected(): boolean {
		return this._core.someSelected;
	}

	public isRowSelected = (index: number): boolean => {
		return this._core.isRowSelected(index);
	};

	// ── Event handlers ────────────────────────────────────────────────────────────

	public handleSort = (column: TableColumn): void => {
		this._core.handleSortClick(column);
	};

	public handleSelectAll = (): void => {
		this._core.toggleSelectAll();
	};

	public handleSelectRow = (index: number, event: Event): void => {
		this._core.toggleSelectRow(index, event);
	};

	public handleRowClick = (row: Record<string, unknown>, index: number): void => {
		this._core.emitRowClick(row, index);
	};
}
