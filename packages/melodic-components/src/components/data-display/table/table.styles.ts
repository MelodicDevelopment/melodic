import { css } from '@melodicdev/core';

export const tableStyles = () => css`
	:host {
		display: block;
	}

	.ml-table {
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		background-color: var(--ml-color-surface);
		overflow: hidden;
		font-family: var(--ml-font-sans);
	}

	/* ── Header ── */
	.ml-table__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-border) solid var(--ml-color-border);
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
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-table__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
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
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-table--sticky-header thead {
		position: sticky;
		top: 0;
		z-index: 1;
	}

	thead tr {
		border-bottom: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-table__th {
		padding: var(--ml-space-3) var(--ml-space-6);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-muted);
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
		color: var(--ml-color-text);
	}

	.ml-table__th--sorted {
		color: var(--ml-color-text);
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
		color: var(--ml-color-text-muted);
	}

	.ml-table__th--sorted .ml-table__sort-icon {
		color: var(--ml-color-primary);
	}

	/* ── Body rows ── */
	.ml-table__row {
		border-bottom: var(--ml-border) solid var(--ml-color-border);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-table__row:last-child {
		border-bottom: none;
	}

	.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-table__row--selected {
		background-color: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04));
	}

	.ml-table--hoverable .ml-table__row--selected:hover {
		background-color: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.06));
	}

	/* Striped */
	.ml-table--striped .ml-table__row:nth-child(even) {
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-table--striped.ml-table--hoverable .ml-table__row:hover {
		background-color: var(--ml-color-surface-raised);
	}

	/* ── Body cells ── */
	.ml-table__td {
		padding: var(--ml-space-4) var(--ml-space-6);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text);
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
	}

	.ml-table--sm .ml-table__check-cell {
		padding: var(--ml-space-2) var(--ml-space-2) var(--ml-space-2) var(--ml-space-4);
	}

	.ml-table__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--ml-color-primary);
		cursor: pointer;
		margin: 0;
		vertical-align: middle;
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
		border-top: var(--ml-border) solid var(--ml-color-border);
	}

	.ml-table--sm .ml-table__footer--visible {
		padding: var(--ml-space-2) var(--ml-space-4);
	}
`;
