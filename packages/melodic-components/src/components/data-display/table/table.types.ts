export interface TableColumn {
	/** Property key to read from row data */
	key: string;

	/** Column header label */
	label: string;

	/** Whether column is sortable */
	sortable?: boolean;

	/** Cell text alignment */
	align?: 'left' | 'center' | 'right';

	/** Fixed column width (CSS value) */
	width?: string;

	/** Custom cell renderer. Return a TemplateResult (html`...`) or string. */
	render?: (value: unknown, row: Record<string, unknown>, index: number) => unknown;
}

export type SortDirection = 'asc' | 'desc';
