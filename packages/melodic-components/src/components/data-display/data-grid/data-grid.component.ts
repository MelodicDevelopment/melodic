import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender, OnPropertyChange } from '@melodicdev/core';
import type { DataGridColumn, SortDirection } from './data-grid.types.js';
import { dataGridTemplate } from './data-grid.template.js';
import { dataGridStyles } from './data-grid.styles.js';
import { TableCore } from '../table-core/index.js';

/**
 * ml-data-grid — Full-featured data grid with virtual scrolling, sorting, filtering,
 * selection, column resizing, column reordering, pinned columns, and pagination.
 *
 * @example
 * ```html
 * <ml-data-grid
 *   .columns=${columns}
 *   .rows=${rows}
 *   selectable
 *   virtual
 *   show-filter-row
 *   grid-title="Users"
 *   page-size="50"
 * ></ml-data-grid>
 * ```
 *
 * @fires ml:sort           - { key, direction }
 * @fires ml:filter         - { filters: Record<string, string> }
 * @fires ml:select         - { selectedRows, selectedIndices, allSelected } where `selectedRows`
 *   contains the selected row OBJECTS and `selectedIndices` their indices in the original
 *   `rows` array (consumer order). Also emitted when sorting/filtering/paging clears a
 *   non-empty selection. BREAKING (2.x): `selectedRows` previously contained page-relative indices.
 * @fires ml:row-click      - { row, index }
 * @fires ml:column-resize  - { key, width }
 * @fires ml:column-reorder - { order: string[] }
 * @fires ml:page-change    - { page, pageSize }
 *
 * @slot toolbar-actions — Actions placed in the toolbar next to title/description
 */
@MelodicComponent({
	selector: 'ml-data-grid',
	template: dataGridTemplate,
	styles: dataGridStyles,
	attributes: [
		'selectable',
		'striped',
		'hoverable',
		'size',
		'grid-title',
		'description',
		'server-side',
		'page-size',
		'virtual',
		'show-filter-row'
	]
})
export class DataGridComponent implements IElementRef, OnCreate, OnDestroy, OnRender, OnPropertyChange {
	public elementRef!: HTMLElement;

	// ── Attributes ───────────────────────────────────────────────────────────────

	/** Enable row selection via checkboxes */
	public selectable = false;

	/** Alternating row backgrounds */
	public striped = false;

	/** Highlight rows on hover */
	public hoverable = true;

	/** Grid size variant */
	public size: 'sm' | 'md' = 'md';

	/** Optional grid title shown in toolbar */
	public gridTitle = '';

	/** Optional grid description shown in toolbar */
	public description = '';

	/** When true, the grid renders rows as-is without sorting/filtering/pagination */
	public serverSide = false;

	/** Number of rows per page */
	public pageSize = 50;

	/** Enable virtual scrolling (renders only visible rows) */
	public virtual = true;

	/** Show per-column filter inputs below the header row */
	public showFilterRow = false;

	// ── Properties ───────────────────────────────────────────────────────────────

	/** Column definitions */
	public columns: DataGridColumn[] = [];

	/** Row data */
	public rows: Record<string, unknown>[] = [];

	// ── Sort state ───────────────────────────────────────────────────────────────

	public sortKey = '';
	public sortDirection: SortDirection = 'asc';

	// ── Filter state ─────────────────────────────────────────────────────────────

	public filters: Record<string, string> = {};

	// ── Selection state ──────────────────────────────────────────────────────────

	public selectedIndices: number[] = [];

	// ── Pagination state ─────────────────────────────────────────────────────────

	public currentPage = 1;

	// ── Virtual scroll state (reactive — no _ prefix) ────────────────────────────

	public startIndex = 0;
	public endIndex = 50;

	// ── Column sizing / order (reactive — no _ prefix) ───────────────────────────

	public colWidths: Record<string, number> = {};
	public colOrder: string[] = [];

	// ── Resize drag state (reactive for visual feedback) ─────────────────────────

	public resizingKey: string | null = null;

	// ── Reorder drag state (reactive) ────────────────────────────────────────────

	public draggingKey: string | null = null;
	public dragOverKey: string | null = null;

	// ── Private (non-reactive) drag intermediates and shared core ────────────────
	// Properties starting with _ are intentionally excluded from reactivity.

	/** Shared table pipeline: sorting, selection, ml:* events, virtual window. */
	private _core = new TableCore(this, {
		viewportSelector: '.ml-data-grid__viewport',
		displayRows: () => this.processedRows
	});
	private _resizeStartX = 0;
	private _resizeStartWidth = 0;

	// ── Row height by size ────────────────────────────────────────────────────────

	public get rowHeight(): number {
		return this.size === 'sm' ? 36 : 44;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────────

	public onPropertyChange(name: string, _oldVal: unknown, newVal: unknown): void {
		if (name === 'columns' && Array.isArray(newVal)) {
			this._syncColumnState(newVal as DataGridColumn[]);
		}

		if (name === 'rows') {
			// Selection is positional; a new dataset invalidates it. The virtual
			// window recomputes after the new value commits (onPropertyChange fires
			// before the assignment) — after clamping the page when the new dataset
			// has fewer pages than the current one (internal filter/sort already
			// reset it; an external rows replacement must not leave e.g.
			// "Page 5 of 2" and a blank grid).
			this._core.handleRowsChange(() => {
				if (this.currentPage > this.totalPages) {
					this.currentPage = this.totalPages;
				}
			});
		}
	}

	public onCreate(): void {
		this._syncColumnState(this.columns);
		this._core.attachScroller();
	}

	public onRender(): void {
		// Update CSS variable for filter row sticky offset
		const shadow = this.elementRef.shadowRoot;
		if (shadow) {
			const headerRow = shadow.querySelector('.ml-data-grid__header-row') as HTMLElement | null;
			if (headerRow) {
				const h = headerRow.getBoundingClientRect().height;
				if (h > 0) {
					this.elementRef.style.setProperty('--ml-grid-header-h', `${h}px`);
				}
			}
		}

		this._core.syncRenderWindow();
	}

	public onDestroy(): void {
		this._core.detach();
	}

	// ── Private helpers ───────────────────────────────────────────────────────────

	private _syncColumnState(cols: DataGridColumn[]): void {
		this.colOrder = cols.map(c => c.key);
		const newWidths: Record<string, number> = {};
		for (const col of cols) {
			newWidths[col.key] = this.colWidths[col.key] ?? col.width ?? 150;
		}
		this.colWidths = newWidths;
	}

	// ── Data pipeline ─────────────────────────────────────────────────────────────

	public get filteredRows(): Record<string, unknown>[] {
		if (this.serverSide) return this.rows;
		const entries = Object.entries(this.filters).filter(([, v]) => v !== '');
		if (!entries.length) return this.rows;
		return this.rows.filter(row =>
			entries.every(([key, val]) =>
				String(row[key] ?? '').toLowerCase().includes(val.toLowerCase())
			)
		);
	}

	public get sortedRows(): Record<string, unknown>[] {
		if (this.serverSide) return this.filteredRows;
		return this._core.sortRows(this.filteredRows);
	}

	public get pagedRows(): Record<string, unknown>[] {
		if (this.serverSide) return this.rows;
		const start = (this.currentPage - 1) * this.pageSize;
		return this.sortedRows.slice(start, start + this.pageSize);
	}

	public get processedRows(): Record<string, unknown>[] {
		return this.pagedRows;
	}

	public get visibleRows(): Record<string, unknown>[] {
		return this._core.visibleRows;
	}

	public get totalRows(): number {
		return this.serverSide ? this.rows.length : this.filteredRows.length;
	}

	public get totalPages(): number {
		return Math.max(1, Math.ceil(this.totalRows / this.pageSize));
	}

	// ── Column helpers ────────────────────────────────────────────────────────────

	public get orderedColumns(): DataGridColumn[] {
		if (!this.colOrder.length) return this.columns;
		const colMap = new Map(this.columns.map(c => [c.key, c]));
		return this.colOrder
			.filter(k => colMap.has(k))
			.map(k => colMap.get(k)!);
	}

	public get columnWidths(): Record<string, number> {
		const result: Record<string, number> = {};
		for (const col of this.columns) {
			result[col.key] = this.colWidths[col.key] ?? col.width ?? 150;
		}
		return result;
	}

	public get totalGridWidth(): number {
		const colTotal = this.orderedColumns.reduce(
			(sum, col) => sum + (this.columnWidths[col.key] ?? 150),
			0
		);
		return colTotal + (this.selectable ? 44 : 0);
	}

	public get gridTemplateColumns(): string {
		const cols = this.orderedColumns
			.map(col => `${this.columnWidths[col.key] ?? 150}px`)
			.join(' ');
		return this.selectable ? `44px ${cols}` : cols;
	}

	public getPinnedLeftOffset(key: string): number {
		let offset = this.selectable ? 44 : 0;
		for (const col of this.orderedColumns) {
			if (col.key === key) return offset;
			if (col.pinned === 'left') {
				offset += this.columnWidths[col.key] ?? 150;
			}
		}
		return 0;
	}

	public getPinnedRightOffset(key: string): number {
		let offset = 0;
		for (let i = this.orderedColumns.length - 1; i >= 0; i--) {
			const col = this.orderedColumns[i];
			if (col.key === key) return offset;
			if (col.pinned === 'right') {
				offset += this.columnWidths[col.key] ?? 150;
			}
		}
		return 0;
	}

	public get lastLeftPinnedKey(): string | null {
		let key: string | null = null;
		for (const col of this.orderedColumns) {
			if (col.pinned === 'left') key = col.key;
		}
		return key;
	}

	public get firstRightPinnedKey(): string | null {
		for (const col of this.orderedColumns) {
			if (col.pinned === 'right') return col.key;
		}
		return null;
	}

	public get topSpacerHeight(): number {
		return this._core.topSpacerHeight;
	}

	public get bottomSpacerHeight(): number {
		return this._core.bottomSpacerHeight;
	}

	// ── Selection ─────────────────────────────────────────────────────────────────

	public get allSelected(): boolean {
		return this._core.allSelected;
	}

	public get someSelected(): boolean {
		return this._core.someSelected;
	}

	public isRowSelected = (index: number): boolean => this._core.isRowSelected(index);

	// ── Event handlers ────────────────────────────────────────────────────────────

	public handleSort = (col: DataGridColumn): void => {
		// Sorting restarts pagination from the first page before events fire.
		this._core.handleSortClick(col, () => {
			this.currentPage = 1;
		});
	};

	public handleFilterInput = (key: string, e: Event): void => {
		const val = (e.target as HTMLInputElement).value;
		this.filters = { ...this.filters, [key]: val };
		this.currentPage = 1;
		// Filtering changes which rows are present; positional selection no longer applies.
		const hadSelection = this._core.clearSelection();
		this._core.invalidateScroller();
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:filter', {
				bubbles: true,
				composed: true,
				detail: { filters: this.filters }
			})
		);
		if (hadSelection) this._core.emitSelect();
	};

	public handleSelectAll = (): void => {
		this._core.toggleSelectAll();
	};

	public handleSelectRow = (index: number, e: Event): void => {
		this._core.toggleSelectRow(index, e);
	};

	public handleRowClick = (row: Record<string, unknown>, index: number): void => {
		this._core.emitRowClick(row, index);
	};

	public handleResizeStart = (key: string, e: PointerEvent): void => {
		this.resizingKey = key;
		this._resizeStartX = e.clientX;
		this._resizeStartWidth = this.columnWidths[key] ?? 150;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		e.stopPropagation();
		e.preventDefault();
	};

	public handleResizeMove = (key: string, e: PointerEvent): void => {
		if (this.resizingKey !== key) return;
		const delta = e.clientX - this._resizeStartX;
		const col = this.columns.find(c => c.key === key);
		const minW = col?.minWidth ?? 80;
		this.colWidths = {
			...this.colWidths,
			[key]: Math.max(minW, this._resizeStartWidth + delta)
		};
	};

	public handleResizeEnd = (): void => {
		if (!this.resizingKey) return;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:column-resize', {
				bubbles: true,
				composed: true,
				detail: { key: this.resizingKey, width: this.colWidths[this.resizingKey] }
			})
		);
		this.resizingKey = null;
	};

	public handleDragStart = (key: string, e: DragEvent): void => {
		this.draggingKey = key;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	};

	public handleDragOver = (key: string, e: DragEvent): void => {
		e.preventDefault();
		if (this.dragOverKey !== key) this.dragOverKey = key;
	};

	public handleDragEnd = (): void => {
		this.draggingKey = null;
		this.dragOverKey = null;
	};

	public handleDrop = (targetKey: string): void => {
		if (!this.draggingKey || this.draggingKey === targetKey) {
			this.draggingKey = null;
			this.dragOverKey = null;
			return;
		}
		const base = this.colOrder.length ? this.colOrder : this.columns.map(c => c.key);
		const order = [...base];
		const fromIdx = order.indexOf(this.draggingKey);
		const toIdx = order.indexOf(targetKey);
		if (fromIdx !== -1 && toIdx !== -1) {
			order.splice(fromIdx, 1);
			order.splice(toIdx, 0, this.draggingKey);
		}
		this.colOrder = order;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:column-reorder', {
				bubbles: true,
				composed: true,
				detail: { order: this.colOrder }
			})
		);
		this.draggingKey = null;
		this.dragOverKey = null;
	};

	public goToPage = (page: number): void => {
		if (page < 1 || page > this.totalPages) return;
		this.currentPage = page;
		// Selection indices are page-relative; clear on page change so the header
		// checkbox and ml:select don't report rows from the previous page.
		const hadSelection = this._core.clearSelection();
		this._core.scrollViewportToTop();
		this._core.invalidateScroller();
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:page-change', {
				bubbles: true,
				composed: true,
				detail: { page: this.currentPage, pageSize: this.pageSize }
			})
		);
		if (hadSelection) this._core.emitSelect();
	};
}
