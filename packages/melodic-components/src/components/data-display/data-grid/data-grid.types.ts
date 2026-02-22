export interface DataGridColumn {
	/** Property key to read from row data */
	key: string;

	/** Column header label */
	label: string;

	/** Column width in px (default 150) */
	width?: number;

	/** Minimum column width in px when resizing (default 80) */
	minWidth?: number;

	/** Whether column is sortable */
	sortable?: boolean;

	/** Whether column has a filter input in the filter row */
	filterable?: boolean;

	/** Whether column can be resized (default true) */
	resizable?: boolean;

	/** Whether column can be reordered via drag (default true) */
	reorderable?: boolean;

	/** Pin column to left or right edge */
	pinned?: 'left' | 'right' | false;

	/** Cell text alignment */
	align?: 'left' | 'center' | 'right';

	/** Custom cell renderer — return a TemplateResult or string */
	render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
}

export type SortDirection = 'asc' | 'desc';

export interface DataGridState {
	sortKey: string;
	sortDirection: SortDirection;
	filters: Record<string, string>;
	currentPage: number;
	pageSize: number;
}
