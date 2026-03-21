import { css } from '@melodicdev/core';

export const dataGridStyles = () => css`
	:host {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-width: 0;
		font-family: var(--ml-font-sans);

		/* ── Data Grid: surface ── */
		--ml-data-grid-bg: var(--ml-color-surface);
		--ml-data-grid-border-width: var(--ml-border);
		--ml-data-grid-border-color: var(--ml-color-border);
		--ml-data-grid-radius: var(--ml-radius-lg);

		/* ── Data Grid: header ── */
		--ml-data-grid-header-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-header-color: var(--ml-color-text-muted);
		--ml-data-grid-header-sorted-color: var(--ml-color-text);

		/* ── Data Grid: title ── */
		--ml-data-grid-title-color: var(--ml-color-text);
		--ml-data-grid-description-color: var(--ml-color-text-muted);

		/* ── Data Grid: rows ── */
		--ml-data-grid-row-hover-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-row-selected-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04));
		--ml-data-grid-row-selected-hover-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.07));
		--ml-data-grid-row-striped-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-row-striped-hover-bg: var(--ml-color-surface-raised);

		/* ── Data Grid: cells ── */
		--ml-data-grid-cell-color: var(--ml-color-text);

		/* ── Data Grid: drag-over ── */
		--ml-data-grid-drag-over-bg: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.08));
		--ml-data-grid-drag-over-color: var(--ml-color-primary);

		/* ── Data Grid: sort icon ── */
		--ml-data-grid-sort-color: var(--ml-color-text-muted);
		--ml-data-grid-sort-active-color: var(--ml-color-primary);

		/* ── Data Grid: resize handle ── */
		--ml-data-grid-resize-active-color: var(--ml-color-primary);

		/* ── Data Grid: checkbox ── */
		--ml-data-grid-checkbox-accent: var(--ml-color-primary);

		/* ── Data Grid: filter input ── */
		--ml-data-grid-filter-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-filter-border-color: var(--ml-color-border);
		--ml-data-grid-filter-focus-color: var(--ml-color-primary);
		--ml-data-grid-filter-focus-ring: 0 0 0 2px var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.12));

		/* ── Data Grid: scrollbar ── */
		--ml-data-grid-scrollbar-thumb: var(--ml-color-border);
		--ml-data-grid-scrollbar-thumb-hover: var(--ml-color-text-muted);

		/* ── Data Grid: footer ── */
		--ml-data-grid-footer-bg: var(--ml-color-surface);
		--ml-data-grid-footer-color: var(--ml-color-text-muted);
		--ml-data-grid-page-btn-border: var(--ml-color-border);
		--ml-data-grid-page-btn-color: var(--ml-color-text-muted);
		--ml-data-grid-page-btn-hover-bg: var(--ml-color-surface-sunken);
		--ml-data-grid-page-btn-hover-color: var(--ml-color-text);
		--ml-data-grid-page-btn-hover-border: var(--ml-color-border-strong);
	}

	/* ── Root container ── */
	.ml-data-grid {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		border-radius: var(--ml-data-grid-radius);
		background-color: var(--ml-data-grid-bg);
		overflow: hidden;
	}

	/* ── Toolbar ── */
	.ml-data-grid__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		flex-shrink: 0;
	}

	.ml-data-grid__toolbar-text {
		display: flex;
		flex-direction: column;
		gap: var(--ml-space-1);
	}

	.ml-data-grid__title {
		margin: 0;
		font-size: var(--ml-text-lg);
		font-weight: var(--ml-font-semibold);
		color: var(--ml-data-grid-title-color);
		line-height: var(--ml-leading-tight);
	}

	.ml-data-grid__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-description-color);
		line-height: var(--ml-leading-normal);
	}

	/* ── Scrollable viewport — single scroll container ── */
	.ml-data-grid__viewport {
		flex: 1;
		overflow: auto;
		position: relative;
		min-height: 0;
		min-width: 0;
	}

	.ml-data-grid__viewport::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-thumb {
		background: var(--ml-data-grid-scrollbar-thumb);
		border-radius: 3px;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-thumb:hover {
		background: var(--ml-data-grid-scrollbar-thumb-hover);
	}

	.ml-data-grid__viewport::-webkit-scrollbar-corner {
		background: transparent;
	}

	/* ── Inner wrapper — forces horizontal scroll via min-width ── */
	.ml-data-grid__inner {
		position: relative;
	}

	/* ── Header row — sticky at top ── */
	.ml-data-grid__header-row {
		display: grid;
		position: sticky;
		top: 0;
		z-index: 2;
		background: var(--ml-data-grid-header-bg);
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
	}

	/* ── Filter row — sticky below header ── */
	.ml-data-grid__filter-row {
		display: grid;
		position: sticky;
		top: var(--ml-grid-header-h, 40px);
		z-index: 2;
		background: var(--ml-data-grid-bg);
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		padding: var(--ml-space-2) 0;
	}

	/* ── Header cells ── */
	.ml-data-grid__th {
		position: relative;
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-data-grid-header-color);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		user-select: none;
		background: var(--ml-data-grid-header-bg);
	}

	.ml-data-grid--sm .ml-data-grid__th {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: calc(var(--ml-text-xs) * 0.9);
	}

	.ml-data-grid__th--left { text-align: left; }
	.ml-data-grid__th--center { text-align: center; }
	.ml-data-grid__th--right { text-align: right; }

	.ml-data-grid__th--sortable {
		cursor: pointer;
		transition: color var(--ml-duration-150) var(--ml-ease-in-out);
	}

	.ml-data-grid__th--sortable:hover {
		color: var(--ml-data-grid-header-sorted-color);
	}

	.ml-data-grid__th--sorted {
		color: var(--ml-data-grid-header-sorted-color);
	}

	.ml-data-grid__th--drag-over {
		background: var(--ml-data-grid-drag-over-bg);
		color: var(--ml-data-grid-drag-over-color);
	}

	.ml-data-grid__th--dragging {
		opacity: 0.5;
	}

	.ml-data-grid__th-content {
		display: inline-flex;
		align-items: center;
		gap: var(--ml-space-1);
		min-width: 0;
		overflow: hidden;
	}

	.ml-data-grid__sort-icon {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--ml-data-grid-sort-color);
	}

	.ml-data-grid__th--sorted .ml-data-grid__sort-icon {
		color: var(--ml-data-grid-sort-active-color);
	}

	/* ── Resize handle ── */
	.ml-data-grid__resize-handle {
		position: absolute;
		right: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		cursor: col-resize;
		background: transparent;
		transition: background var(--ml-duration-150);
		z-index: 1;
	}

	.ml-data-grid__resize-handle:hover,
	.ml-data-grid__th--resizing .ml-data-grid__resize-handle {
		background: var(--ml-data-grid-resize-active-color);
	}

	/* ── Filter cells ── */
	.ml-data-grid__filter-cell {
		display: flex;
		align-items: center;
		padding: 0 var(--ml-space-2);
		background: var(--ml-data-grid-bg);
		position: relative;
	}

	.ml-data-grid__filter-cell--pinned-left {
		position: sticky;
		z-index: 3;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__filter-input {
		width: 100%;
		padding: var(--ml-space-1-5) var(--ml-space-2);
		font-size: var(--ml-text-xs);
		font-family: var(--ml-font-sans);
		color: var(--ml-data-grid-cell-color);
		background: var(--ml-data-grid-filter-bg);
		border: var(--ml-data-grid-border-width) solid var(--ml-data-grid-filter-border-color);
		border-radius: var(--ml-radius-sm);
		outline: none;
		transition: border-color var(--ml-duration-150);
	}

	.ml-data-grid__filter-input::placeholder {
		color: var(--ml-data-grid-header-color);
	}

	.ml-data-grid__filter-input:focus {
		border-color: var(--ml-data-grid-filter-focus-color);
		box-shadow: var(--ml-data-grid-filter-focus-ring);
	}

	/* ── Virtual scroll spacers ── */
	.ml-data-grid__top-spacer,
	.ml-data-grid__bottom-spacer {
		display: block;
	}

	/* ── Data rows ── */
	.ml-data-grid__row {
		display: grid;
		border-bottom: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
		cursor: default;
	}

	.ml-data-grid__row:last-child {
		border-bottom: none;
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover {
		background-color: var(--ml-data-grid-row-hover-bg);
	}

	.ml-data-grid__row--selected {
		background-color: var(--ml-data-grid-row-selected-bg);
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover {
		background-color: var(--ml-data-grid-row-selected-hover-bg);
	}

	.ml-data-grid--striped .ml-data-grid__row--even {
		background-color: var(--ml-data-grid-row-striped-bg);
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover {
		background-color: var(--ml-data-grid-row-striped-hover-bg);
	}

	/* ── Data cells ── */
	.ml-data-grid__td {
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-cell-color);
		vertical-align: middle;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		background: inherit;
	}

	.ml-data-grid--sm .ml-data-grid__td {
		padding: var(--ml-space-2) var(--ml-space-3);
		font-size: var(--ml-text-xs);
	}

	.ml-data-grid__td--left { text-align: left; }
	.ml-data-grid__td--center { text-align: center; }
	.ml-data-grid__td--right { text-align: right; }

	/* ── Checkbox column ── */
	.ml-data-grid__check-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--ml-space-3);
		position: sticky;
		left: 0;
		z-index: 1;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__header-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-data-grid-header-bg);
	}

	.ml-data-grid__filter-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid--sm .ml-data-grid__check-cell {
		padding: var(--ml-space-2);
	}

	.ml-data-grid__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--ml-data-grid-checkbox-accent);
		cursor: pointer;
		margin: 0;
		flex-shrink: 0;
	}

	/* ── Pinned columns ── */
	.ml-data-grid__th--pinned-left,
	.ml-data-grid__td--pinned-left {
		position: sticky;
		z-index: 1;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-left {
		z-index: 3;
		background: var(--ml-data-grid-header-bg);
	}

	/* Pinned left shadow */
	.ml-data-grid__th--pinned-left::after,
	.ml-data-grid__td--pinned-left::after {
		content: '';
		position: absolute;
		top: 0;
		right: -4px;
		bottom: 0;
		width: 4px;
		background: linear-gradient(to right, rgba(0, 0, 0, 0.06), transparent);
		pointer-events: none;
	}

	.ml-data-grid__th--pinned-right,
	.ml-data-grid__td--pinned-right {
		position: sticky;
		right: 0;
		z-index: 1;
		background: var(--ml-data-grid-bg);
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-right {
		z-index: 3;
		background: var(--ml-data-grid-header-bg);
	}

	/* Pinned right shadow */
	.ml-data-grid__th--pinned-right::before,
	.ml-data-grid__td--pinned-right::before {
		content: '';
		position: absolute;
		top: 0;
		left: -4px;
		bottom: 0;
		width: 4px;
		background: linear-gradient(to left, rgba(0, 0, 0, 0.06), transparent);
		pointer-events: none;
	}

	/* Row-state backgrounds for pinned + check cells */
	.ml-data-grid--striped .ml-data-grid__row--even .ml-data-grid__td--pinned-left,
	.ml-data-grid--striped .ml-data-grid__row--even .ml-data-grid__td--pinned-right,
	.ml-data-grid--striped .ml-data-grid__row--even .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-striped-bg);
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-hover-bg);
	}

	.ml-data-grid__row--selected .ml-data-grid__td--pinned-left,
	.ml-data-grid__row--selected .ml-data-grid__td--pinned-right,
	.ml-data-grid__row--selected .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-selected-bg);
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-selected-hover-bg);
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__check-cell {
		background: var(--ml-data-grid-row-striped-hover-bg);
	}

	/* ── Footer / Pagination ── */
	.ml-data-grid__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-3) var(--ml-space-6);
		border-top: var(--ml-data-grid-border-width) solid var(--ml-data-grid-border-color);
		background: var(--ml-data-grid-footer-bg);
		flex-shrink: 0;
	}

	.ml-data-grid--sm .ml-data-grid__footer {
		padding: var(--ml-space-2) var(--ml-space-4);
	}

	.ml-data-grid__footer-count {
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-footer-color);
	}

	.ml-data-grid--sm .ml-data-grid__footer-count {
		font-size: var(--ml-text-xs);
	}

	.ml-data-grid__footer-pagination {
		display: flex;
		align-items: center;
		gap: var(--ml-space-3);
	}

	.ml-data-grid__page-info {
		font-size: var(--ml-text-sm);
		color: var(--ml-data-grid-footer-color);
		white-space: nowrap;
	}

	.ml-data-grid--sm .ml-data-grid__page-info {
		font-size: var(--ml-text-xs);
	}

	.ml-data-grid__page-controls {
		display: flex;
		align-items: center;
		gap: var(--ml-space-1);
	}

	.ml-data-grid__page-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: var(--ml-data-grid-border-width) solid var(--ml-data-grid-page-btn-border);
		border-radius: var(--ml-radius-md);
		background: var(--ml-data-grid-bg);
		color: var(--ml-data-grid-page-btn-color);
		cursor: pointer;
		transition:
			background-color var(--ml-duration-150),
			color var(--ml-duration-150),
			border-color var(--ml-duration-150);
		font-family: var(--ml-font-sans);
	}

	.ml-data-grid--sm .ml-data-grid__page-btn {
		width: 1.75rem;
		height: 1.75rem;
	}

	.ml-data-grid__page-btn:hover:not(:disabled) {
		background: var(--ml-data-grid-page-btn-hover-bg);
		color: var(--ml-data-grid-page-btn-hover-color);
		border-color: var(--ml-data-grid-page-btn-hover-border);
	}

	.ml-data-grid__page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`;
