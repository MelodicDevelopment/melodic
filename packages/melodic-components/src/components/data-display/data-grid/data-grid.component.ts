import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender, OnPropertyChange } from '@melodicdev/core';
import type { DataGridColumn, SortDirection } from './data-grid.types.js';
import { dataGridTemplate } from './data-grid.template.js';
import { dataGridStyles } from './data-grid.styles.js';
import { VirtualScroller } from '../../../utils/virtual-scroll/index.js';

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
 * @fires ml:select         - { selectedRows: number[], allSelected: boolean }
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

	// ── Private (non-reactive) DOM refs and drag intermediates ───────────────────
	// Properties starting with _ are intentionally excluded from reactivity.

	private _scroller = new VirtualScroller();
	private _viewport: HTMLElement | null = null;
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
	}

	public onCreate(): void {
		this._syncColumnState(this.columns);
		this._attachScroller();
	}

	public onRender(): void {
		this._attachScroller();

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

		// Compute initial end index when viewport height not yet known
		if (this._viewport && this._viewport.clientHeight === 0 && this.processedRows.length > 0) {
			const approxEnd = Math.min(this.processedRows.length, Math.ceil(600 / this.rowHeight) + 6);
			if (approxEnd !== this.endIndex) {
				this.endIndex = approxEnd;
			}
		}

		if (!this.virtual) {
			const total = this.processedRows.length;
			if (this.endIndex !== total) this.endIndex = total;
		}
	}

	public onDestroy(): void {
		this._scroller.detach();
		this._viewport = null;
	}

	// ── Private helpers ───────────────────────────────────────────────────────────

	private _attachScroller(): void {
		if (this._viewport) return; // already attached
		const shadow = this.elementRef.shadowRoot;
		if (!shadow) return;
		this._viewport = shadow.querySelector('.ml-data-grid__viewport') as HTMLElement | null;
		if (!this._viewport) return;
		this._scroller.attach(this._viewport, {
			rowHeight: () => this.rowHeight,
			itemCount: () => this.processedRows.length,
			onUpdate: (start, end) => { this.startIndex = start; this.endIndex = end; },
			enabled: () => this.virtual,
		});
	}

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
		if (this.serverSide || !this.sortKey) return this.filteredRows;
		const key = this.sortKey;
		const dir = this.sortDirection === 'asc' ? 1 : -1;
		return [...this.filteredRows].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal == null) return bVal == null ? 0 : 1;
			if (bVal == null) return -1;
			if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
			return String(aVal).localeCompare(String(bVal)) * dir;
		});
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
		if (!this.virtual) return this.processedRows;
		return this.processedRows.slice(this.startIndex, this.endIndex);
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

	public get topSpacerHeight(): number {
		return this.virtual ? this.startIndex * this.rowHeight : 0;
	}

	public get bottomSpacerHeight(): number {
		if (!this.virtual) return 0;
		return Math.max(0, (this.processedRows.length - this.endIndex) * this.rowHeight);
	}

	// ── Selection ─────────────────────────────────────────────────────────────────

	public get allSelected(): boolean {
		return this.processedRows.length > 0 && this.selectedIndices.length === this.processedRows.length;
	}

	public get someSelected(): boolean {
		return this.selectedIndices.length > 0 && !this.allSelected;
	}

	public isRowSelected = (index: number): boolean => this.selectedIndices.includes(index);

	// ── Event handlers ────────────────────────────────────────────────────────────

	public handleSort = (col: DataGridColumn): void => {
		if (!col.sortable) return;
		if (this.sortKey === col.key) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortKey = col.key;
			this.sortDirection = 'asc';
		}
		this.currentPage = 1;
		this._scroller.invalidate();
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:sort', {
				bubbles: true,
				composed: true,
				detail: { key: this.sortKey, direction: this.sortDirection }
			})
		);
	};

	public handleFilterInput = (key: string, e: Event): void => {
		const val = (e.target as HTMLInputElement).value;
		this.filters = { ...this.filters, [key]: val };
		this.currentPage = 1;
		this._scroller.invalidate();
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:filter', {
				bubbles: true,
				composed: true,
				detail: { filters: this.filters }
			})
		);
	};

	public handleSelectAll = (): void => {
		this.selectedIndices = this.allSelected ? [] : this.processedRows.map((_, i) => i);
		this._emitSelect();
	};

	public handleSelectRow = (index: number, e: Event): void => {
		e.stopPropagation();
		this.selectedIndices = this.selectedIndices.includes(index)
			? this.selectedIndices.filter(i => i !== index)
			: [...this.selectedIndices, index];
		this._emitSelect();
	};

	public handleRowClick = (row: Record<string, unknown>, index: number): void => {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:row-click', {
				bubbles: true,
				composed: true,
				detail: { row, index }
			})
		);
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
		if (this._viewport) this._viewport.scrollTop = 0;
		this._scroller.invalidate();
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:page-change', {
				bubbles: true,
				composed: true,
				detail: { page: this.currentPage, pageSize: this.pageSize }
			})
		);
	};

	private _emitSelect(): void {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:select', {
				bubbles: true,
				composed: true,
				detail: { selectedRows: this.selectedIndices, allSelected: this.allSelected }
			})
		);
	}
}
