import { VirtualScroller } from '../../../utils/virtual-scroll/index.js';

/**
 * TableCore — shared internals for ml-table and ml-data-grid.
 *
 * Both components render the same data pipeline — sort → (grid only:
 * filter/page) → virtual window — with identical selection semantics and
 * event contracts (ml:sort, ml:select, ml:row-click). TableCore owns that
 * shared pipeline; each component instantiates one (composition, mirroring
 * how both already compose VirtualScroller) and delegates to it.
 *
 * Component-specific features stay in the components: ml-table keeps manual
 * sort and footer/header-actions slots; ml-data-grid keeps filtering,
 * pagination, column resize/reorder, and pinned columns.
 *
 * INTERNAL: not exported from the package root — implementation detail only.
 */

export type SortDirection = 'asc' | 'desc';

/** Minimal structural column contract shared by TableColumn and DataGridColumn. */
export interface TableCoreColumn {
	/** Property key to read from row data */
	key: string;

	/** Whether column is sortable */
	sortable?: boolean;

	/** Custom cell renderer — return a TemplateResult or string */
	render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
}

/**
 * The component state TableCore reads and writes. Both components pass
 * themselves as the host: writes go through the framework's observed setters,
 * so state changes made by the core schedule re-renders exactly like the
 * component's own writes.
 */
export interface TableCoreHost {
	/** The custom element — event dispatch target and shadow-root owner */
	readonly elementRef: HTMLElement;

	/** Consumer-provided rows in original order (the ml:select index basis) */
	readonly rows: Record<string, unknown>[];

	/** Whether virtual scrolling is enabled */
	readonly virtual: boolean;

	/** Fixed row height in px for the current size variant */
	readonly rowHeight: number;

	/** Currently sorted column key ('' = unsorted) */
	sortKey: string;

	/** Current sort direction */
	sortDirection: SortDirection;

	/** Positional selection indices into the display (render-order) rows */
	selectedIndices: number[];

	/** First rendered row index (virtual window) */
	startIndex: number;

	/** One past the last rendered row index (virtual window) */
	endIndex: number;
}

export interface TableCoreOptions {
	/** Shadow-root selector for the scrollable viewport element */
	viewportSelector: string;

	/**
	 * Rows in final render order after the component's full pipeline
	 * (table: sortedRows; grid: processedRows = filter → sort → page).
	 */
	displayRows: () => Record<string, unknown>[];
}

/**
 * Default cell renderer: the column's render callback when present, otherwise
 * the raw value (blank for null/undefined).
 */
export function renderCell(column: TableCoreColumn, row: Record<string, unknown>, index: number): unknown {
	if (column.render) {
		return column.render(row[column.key], row, index);
	}
	return row[column.key] ?? '';
}

export class TableCore {
	private readonly _host: TableCoreHost;
	private readonly _options: TableCoreOptions;
	private readonly _scroller = new VirtualScroller();
	private _viewport: HTMLElement | null = null;

	constructor(host: TableCoreHost, options: TableCoreOptions) {
		this._host = host;
		this._options = options;
	}

	// ── Sorting ───────────────────────────────────────────────────────────────────

	/**
	 * Sort rows by the host's current sortKey/sortDirection. Returns the input
	 * untouched when no sort key is active. null/undefined values sort last
	 * regardless of direction; numbers sort numerically, everything else by
	 * locale-aware string comparison.
	 */
	public sortRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
		const key = this._host.sortKey;
		if (!key) return rows;
		const dir = this._host.sortDirection === 'asc' ? 1 : -1;
		return [...rows].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal == null) return bVal == null ? 0 : 1;
			if (bVal == null) return -1;
			if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
			return String(aVal).localeCompare(String(bVal)) * dir;
		});
	}

	/**
	 * Header-click sort cycle: toggles direction on the active column, resets
	 * to ascending on a new column. Selection is positional; sorting reorders
	 * rows, so it is cleared. Fires ml:sort, then — when a non-empty selection
	 * was cleared — ml:select, so consumers holding the previous selection
	 * stay in sync.
	 *
	 * @param beforeDispatch component hook applied after the sort state updates
	 *   and before events fire (the grid resets its page here).
	 */
	public handleSortClick(column: TableCoreColumn, beforeDispatch?: () => void): void {
		if (!column.sortable) return;
		if (this._host.sortKey === column.key) {
			this._host.sortDirection = this._host.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this._host.sortKey = column.key;
			this._host.sortDirection = 'asc';
		}
		beforeDispatch?.();
		const hadSelection = this.clearSelection();
		this._scroller.invalidate();
		this._host.elementRef.dispatchEvent(
			new CustomEvent('ml:sort', {
				bubbles: true,
				composed: true,
				detail: { key: this._host.sortKey, direction: this._host.sortDirection }
			})
		);
		if (hadSelection) this.emitSelect();
	}

	// ── Selection ─────────────────────────────────────────────────────────────────

	public get allSelected(): boolean {
		const total = this._options.displayRows().length;
		return total > 0 && this._host.selectedIndices.length === total;
	}

	public get someSelected(): boolean {
		return this._host.selectedIndices.length > 0 && !this.allSelected;
	}

	public isRowSelected(index: number): boolean {
		return this._host.selectedIndices.includes(index);
	}

	public toggleSelectAll(): void {
		this._host.selectedIndices = this.allSelected
			? []
			: this._options.displayRows().map((_, i) => i);
		this.emitSelect();
	}

	public toggleSelectRow(index: number, event: Event): void {
		event.stopPropagation();
		this._host.selectedIndices = this._host.selectedIndices.includes(index)
			? this._host.selectedIndices.filter(i => i !== index)
			: [...this._host.selectedIndices, index];
		this.emitSelect();
	}

	/**
	 * Clear the positional selection (the rows changed or reordered under it).
	 * Returns whether a non-empty selection was cleared so the caller can
	 * announce it via emitSelect() AFTER dispatching its own event.
	 */
	public clearSelection(): boolean {
		const hadSelection = this._host.selectedIndices.length > 0;
		this._host.selectedIndices = [];
		return hadSelection;
	}

	/**
	 * ml:select contract: internal selection state is display-order positional
	 * (it mirrors what is rendered); the public detail carries the selected row
	 * OBJECTS plus their indices in the consumer's original `rows` array, so
	 * selections survive re-sorting/filtering/paging on the consumer side.
	 */
	public emitSelect(): void {
		const display = this._options.displayRows();
		const selectedRows = this._host.selectedIndices
			.map((i) => display[i])
			.filter((row): row is Record<string, unknown> => row !== undefined);

		const indexByRow = new Map<Record<string, unknown>, number>();
		this._host.rows.forEach((row, i) => {
			if (!indexByRow.has(row)) indexByRow.set(row, i);
		});
		const selectedIndices = selectedRows
			.map((row) => indexByRow.get(row))
			.filter((i): i is number => i !== undefined);

		this._host.elementRef.dispatchEvent(
			new CustomEvent('ml:select', {
				bubbles: true,
				composed: true,
				detail: { selectedRows, selectedIndices, allSelected: this.allSelected }
			})
		);
	}

	// ── Row click ─────────────────────────────────────────────────────────────────

	public emitRowClick(row: Record<string, unknown>, index: number): void {
		this._host.elementRef.dispatchEvent(
			new CustomEvent('ml:row-click', {
				bubbles: true,
				composed: true,
				detail: { row, index }
			})
		);
	}

	// ── Virtual scrolling ─────────────────────────────────────────────────────────

	/** Attach the VirtualScroller to the shadow viewport (idempotent). */
	public attachScroller(): void {
		if (this._viewport) return; // already attached
		const shadow = this._host.elementRef.shadowRoot;
		if (!shadow) return;
		this._viewport = shadow.querySelector(this._options.viewportSelector) as HTMLElement | null;
		if (!this._viewport) return;
		this._scroller.attach(this._viewport, {
			rowHeight: () => this._host.rowHeight,
			itemCount: () => this._options.displayRows().length,
			onUpdate: (start, end) => { this._host.startIndex = start; this._host.endIndex = end; },
			enabled: () => this._host.virtual,
		});
	}

	/** Tear down the scroller (call from onDestroy). */
	public detach(): void {
		this._scroller.detach();
		this._viewport = null;
	}

	/** Recompute the virtual window (item count or row height changed). */
	public invalidateScroller(): void {
		this._scroller.invalidate();
	}

	/** Scroll the viewport back to the top (e.g. on page change). */
	public scrollViewportToTop(): void {
		if (this._viewport) this._viewport.scrollTop = 0;
	}

	/**
	 * Handle an external `rows` replacement (called from onPropertyChange,
	 * which fires BEFORE the new value commits). Positional selection is
	 * invalidated by a new dataset — reset silently (the consumer initiated
	 * the change). The virtual window is recomputed on a microtask so it sees
	 * the committed rows, after the component's own post-commit adjustment
	 * (the grid clamps its page here) has run.
	 */
	public handleRowsChange(afterCommit?: () => void): void {
		this._host.selectedIndices = [];
		queueMicrotask(() => {
			afterCommit?.();
			this._scroller.invalidate();
		});
	}

	/**
	 * Per-render window maintenance (call from onRender): attaches the
	 * scroller once the viewport exists, seeds an approximate end index while
	 * the viewport height is still unknown (virtual mode), and pins endIndex
	 * to the full row count in non-virtual mode.
	 */
	public syncRenderWindow(): void {
		this.attachScroller();
		const total = this._options.displayRows().length;
		if (this._host.virtual) {
			// Compute initial end index when viewport height not yet known
			if (this._viewport && this._viewport.clientHeight === 0 && total > 0) {
				const approxEnd = Math.min(total, Math.ceil(600 / this._host.rowHeight) + 6);
				if (approxEnd !== this._host.endIndex) {
					this._host.endIndex = approxEnd;
				}
			}
		} else if (this._host.endIndex !== total) {
			this._host.endIndex = total;
		}
	}

	// ── Render window ─────────────────────────────────────────────────────────────

	public get visibleRows(): Record<string, unknown>[] {
		const display = this._options.displayRows();
		if (!this._host.virtual) return display;
		return display.slice(this._host.startIndex, this._host.endIndex);
	}

	public get topSpacerHeight(): number {
		return this._host.virtual ? this._host.startIndex * this._host.rowHeight : 0;
	}

	public get bottomSpacerHeight(): number {
		if (!this._host.virtual) return 0;
		return Math.max(0, (this._options.displayRows().length - this._host.endIndex) * this._host.rowHeight);
	}
}
