import { css } from '@melodicdev/core';

export const tableStyles = () => css`
	:host {
		display: block;

		/* ── Table: surface ── */
		--ml-table-bg: var(--ml-color-surface);
		--ml-table-border-width: var(--ml-border);
		--ml-table-border-color: var(--ml-color-border);
		--ml-table-radius: var(--ml-radius-lg);
		--ml-table-font: var(--ml-font-sans);

		/* ── Table: header section ── */
		--ml-table-title-color: var(--ml-color-text);
		--ml-table-description-color: var(--ml-color-text-muted);

		/* ── Table: column header ── */
		--ml-table-header-bg: var(--ml-color-surface-sunken);
		--ml-table-header-color: var(--ml-color-text-muted);
		--ml-table-header-sorted-color: var(--ml-color-text);

		/* ── Table: sort icon ── */
		--ml-table-sort-color: var(--ml-color-text-muted);
		--ml-table-sort-active-color: var(--ml-color-primary);

		/* ── Table: rows ── */
		--ml-table-row-hover-bg: var(--ml-color-surface-sunken);
		--ml-table-row-hover-border-color: transparent;
		--ml-table-row-hover-border-width: 0;
		--ml-table-row-selected-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04));
		--ml-table-row-selected-hover-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.06));
		--ml-table-row-striped-bg: var(--ml-color-surface-sunken);
		--ml-table-row-striped-hover-bg: var(--ml-color-surface-raised);

		/* ── Table: cells ── */
		--ml-table-cell-color: var(--ml-color-text);

		/* ── Table: checkbox ── */
		--ml-table-checkbox-accent: var(--ml-color-primary);
	}

	.ml-table {
		border: var(--ml-table-border-width) solid var(--ml-table-border-color);
		border-radius: var(--ml-table-radius);
		background-color: var(--ml-table-bg);
		overflow: hidden;
		font-family: var(--ml-table-font);
	}

	/* ── Header ── */
	.ml-table__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-table-border-width) solid var(--ml-table-border-color);
	}

	.ml-table__header-text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-table__title {
		margin: 0;
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-table-title-color);
		line-height: var(--ml-leading-tight);
	}

	.ml-table__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-table-description-color);
		line-height: var(--ml-leading-normal);
	}

	/* ── Table wrapper ── */
	.ml-table__wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		border-spacing: 0;
	}

	/* ── Header cells ── */
	thead {
		background-color: var(--ml-table-header-bg);
	}

	.ml-table--sticky-header thead {
		position: sticky;
		top: 0;
		z-index: 1;
	}

	thead tr {
		border-bottom: var(--ml-table-border-width) solid var(--ml-table-border-color);
	}

	.ml-table__th {
		padding: var(--ml-space-3) var(--ml-space-6);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-table-header-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		text-align: left;
		white-space: nowrap;
		user-select: none;
	}

	.ml-table--sm .ml-table__th {
		padding: var(--ml-space-2) var(--ml-space-4);
	}

	.ml-table__th--center { text-align: center; }
	.ml-table__th--right { text-align: right; }

	.ml-table__th--sortable {
		cursor: pointer;
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-table__th--sortable:hover {
		color: var(--ml-table-header-sorted-color);
	}

	.ml-table__th--sorted {
		color: var(--ml-table-header-sorted-color);
	}

	.ml-table__th-content {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-table__sort-icon {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--ml-table-sort-color);
	}

	.ml-table__th--sorted .ml-table__sort-icon {
		color: var(--ml-table-sort-active-color);
	}

	/* ── Body rows ── */
	.ml-table__row {
		border-bottom: var(--ml-table-border-width) solid var(--ml-table-border-color);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-table__row:last-child {
		border-bottom: none;
	}

	.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-table-row-hover-bg);
		border-color: var(--ml-table-row-hover-border-color);
		border-width: var(--ml-table-row-hover-border-width);
		border-style: solid;
	}

	.ml-table--row-clickable .ml-table__row {
		cursor: pointer;
	}

	.ml-table__row--selected {
		background-color: var(--ml-table-row-selected-bg);
	}

	.ml-table--hoverable .ml-table__row--selected:hover {
		background-color: var(--ml-table-row-selected-hover-bg);
	}

	/* Striped */
	.ml-table--striped .ml-table__row:nth-child(even) {
		background-color: var(--ml-table-row-striped-bg);
	}

	.ml-table--striped.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-table-row-striped-hover-bg);
	}

	/* ── Body cells ── */
	.ml-table__td {
		padding: var(--ml-space-4) var(--ml-space-6);
		font-size: var(--ml-text-sm);
		color: var(--ml-table-cell-color);
		vertical-align: middle;
	}

	.ml-table--sm .ml-table__td {
		padding: var(--ml-space-2-5) var(--ml-space-4);
		font-size: var(--ml-text-xs);
	}

	.ml-table__td--center { text-align: center; }
	.ml-table__td--right { text-align: right; }

	/* ── Checkbox column ── */
	.ml-table__check-cell {
		width: 2.5rem;
		padding: var(--ml-space-3) var(--ml-space-3) var(--ml-space-3) var(--ml-space-6);
		vertical-align: middle;
		text-align: center;
	}

	.ml-table--sm .ml-table__check-cell {
		padding: var(--ml-space-2) var(--ml-space-2) var(--ml-space-2) var(--ml-space-4);
	}

	.ml-table__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--ml-table-checkbox-accent);
		cursor: pointer;
		margin: 0;
		vertical-align: middle;
	}

	/* ── Virtual scroll ── */
	/* Host fills parent container so height: 100% resolves correctly */
	:host([virtual]) {
		height: 100%;
	}

	/* Flex column so the wrapper can take remaining space after header/footer */
	.ml-table--virtual {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.ml-table--virtual .ml-table__wrapper {
		flex: 1;
		min-height: 0; /* lets flex child shrink below content height */
		overflow-y: auto;
	}

	.ml-table--virtual .ml-table__td {
		height: 44px;
		padding-top: 0;
		padding-bottom: 0;
		box-sizing: border-box;
	}

	.ml-table--virtual.ml-table--sm .ml-table__td {
		height: 36px;
	}

	.ml-table__spacer td {
		padding: 0;
		border: none;
	}

	/* ── Footer ── */
	.ml-table__footer {
		display: none;
	}

	.ml-table__footer--visible {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--ml-space-3) var(--ml-space-6);
		border-top: var(--ml-table-border-width) solid var(--ml-table-border-color);
	}

	.ml-table--sm .ml-table__footer--visible {
		padding: var(--ml-space-2) var(--ml-space-4);
	}
`;
