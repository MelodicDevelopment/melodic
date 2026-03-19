import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef, OnCreate, OnDestroy, OnRender, OnPropertyChange } from '@melodicdev/core';
import type { TableColumn, SortDirection } from './table.types.js';
import { tableTemplate } from './table.template.js';
import { tableStyles } from './table.styles.js';
import { VirtualScroller } from '../../../utils/virtual-scroll/index.js';

// Track elements that receive ml:row-click listeners before custom element upgrade.
// The template engine adds event listeners via addEventListener on un-upgraded elements
// (before the constructor runs), so we intercept at the prototype level to catch them.
const _rowClickTargets = new WeakSet<EventTarget>();
const _origAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
	if (type === 'ml:row-click') {
		_rowClickTargets.add(this);
	}
	_origAddEventListener.call(this, type, listener, options);
};

/**
 * ml-table - Data table with sorting, selection, and custom cell rendering
 *
 * @example
 * ```html
 * <ml-table .columns=${columns} .rows=${rows} striped hoverable></ml-table>
 * ```
 *
 * @fires ml:sort - Emitted when a sortable column header is clicked. Detail: { key, direction }
 * @fires ml:select - Emitted when row selection changes. Detail: { selectedRows, allSelected }
 * @fires ml:row-click - Emitted when a row is clicked. Detail: { row, index }
 *
 * @slot footer - Content for the table footer area (e.g. pagination)
 * @slot header-actions - Actions placed in the header next to title/description
 */
@MelodicComponent({
	selector: 'ml-table',
	template: tableTemplate,
	styles: tableStyles,
	attributes: ['selectable', 'striped', 'hoverable', 'size', 'table-title', 'description', 'sticky-header', 'virtual']
})
export class TableComponent implements IElementRef, OnCreate, OnDestroy, OnRender, OnPropertyChange {
	public elementRef!: HTMLElement;

	/** Whether a row-click listener is attached (auto-detected) */
	public _rowClickable = false;

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

	private _scroller = new VirtualScroller();
	private _viewport: HTMLElement | null = null;

	// ── Row height by size ────────────────────────────────────────────────────────

	public get rowHeight(): number {
		return this.size === 'sm' ? 36 : 44;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────────────

	public onPropertyChange(name: string, _oldVal: unknown, _newVal: unknown): void {
		if (name === 'rows' || name === 'columns') {
			this._scroller.invalidate();
		}
	}

	public onInit(): void {
		this._rowClickable = _rowClickTargets.has(this.elementRef);
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
		this._attachScroller();
	}

	public onRender(): void {
		this._attachScroller();

		// Compute initial end index when viewport height not yet known
		if (this.virtual && this._viewport && this._viewport.clientHeight === 0 && this.sortedRows.length > 0) {
			const approxEnd = Math.min(this.sortedRows.length, Math.ceil(600 / this.rowHeight) + 6);
			if (approxEnd !== this.endIndex) {
				this.endIndex = approxEnd;
			}
		}

		if (!this.virtual) {
			const total = this.sortedRows.length;
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
		this._viewport = shadow.querySelector('.ml-table__wrapper') as HTMLElement | null;
		if (!this._viewport) return;
		this._scroller.attach(this._viewport, {
			rowHeight: () => this.rowHeight,
			itemCount: () => this.sortedRows.length,
			onUpdate: (start, end) => { this.startIndex = start; this.endIndex = end; },
			enabled: () => this.virtual,
		});
	}

	// ── Data ──────────────────────────────────────────────────────────────────────

	/** Rows sorted by current sort key/direction */
	public get sortedRows(): Record<string, unknown>[] {
		if (!this.sortKey) return this.rows;
		const key = this.sortKey;
		const dir = this.sortDirection === 'asc' ? 1 : -1;
		return [...this.rows].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal === undefined || aVal === null) {
				return (bVal === undefined || bVal === null) ? 0 : 1;
			}
			if (bVal === undefined || bVal === null) return -1;
			if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
			return String(aVal).localeCompare(String(bVal)) * dir;
		});
	}

	public get visibleRows(): Record<string, unknown>[] {
		if (!this.virtual) return this.sortedRows;
		return this.sortedRows.slice(this.startIndex, this.endIndex);
	}

	public get topSpacerHeight(): number {
		return this.virtual ? this.startIndex * this.rowHeight : 0;
	}

	public get bottomSpacerHeight(): number {
		if (!this.virtual) return 0;
		return Math.max(0, (this.sortedRows.length - this.endIndex) * this.rowHeight);
	}

	public get colCount(): number {
		return this.columns.length + (this.selectable ? 1 : 0);
	}

	public get allSelected(): boolean {
		return this.rows.length > 0 && this.selectedIndices.length === this.rows.length;
	}

	public get someSelected(): boolean {
		return this.selectedIndices.length > 0 && !this.allSelected;
	}

	public isRowSelected = (index: number): boolean => {
		return this.selectedIndices.includes(index);
	};

	// ── Event handlers ────────────────────────────────────────────────────────────

	public handleSort = (column: TableColumn): void => {
		if (!column.sortable) return;
		if (this.sortKey === column.key) {
			this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortKey = column.key;
			this.sortDirection = 'asc';
		}
		this.selectedIndices = [];
		this._scroller.invalidate();
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:sort', {
				bubbles: true,
				composed: true,
				detail: { key: this.sortKey, direction: this.sortDirection }
			})
		);
	};

	public handleSelectAll = (): void => {
		if (this.allSelected) {
			this.selectedIndices = [];
		} else {
			this.selectedIndices = this.rows.map((_, i) => i);
		}
		this.emitSelect();
	};

	public handleSelectRow = (index: number, event: Event): void => {
		event.stopPropagation();
		if (this.selectedIndices.includes(index)) {
			this.selectedIndices = this.selectedIndices.filter(i => i !== index);
		} else {
			this.selectedIndices = [...this.selectedIndices, index];
		}
		this.emitSelect();
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

	private emitSelect(): void {
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:select', {
				bubbles: true,
				composed: true,
				detail: { selectedRows: this.selectedIndices, allSelected: this.allSelected }
			})
		);
	}
}
