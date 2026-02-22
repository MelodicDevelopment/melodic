import { css } from '@melodicdev/core';

export const dataGridStyles = () => css`
	:host {
		display: flex;
		flex-direction: column;
		height: 100%;
		font-family: var(--ml-font-sans);
	}

	/* ── Root container ── */
	.ml-data-grid {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-lg);
		background-color: var(--ml-color-surface);
		overflow: hidden;
	}

	/* ── Toolbar ── */
	.ml-data-grid__toolbar {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-5) var(--ml-space-6);
		border-bottom: var(--ml-border) solid var(--ml-color-border);
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
		color: var(--ml-color-text);
		line-height: var(--ml-leading-tight);
	}

	.ml-data-grid__description {
		margin: 0;
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
		line-height: var(--ml-leading-normal);
	}

	/* ── Scrollable viewport — single scroll container ── */
	.ml-data-grid__viewport {
		flex: 1;
		overflow: auto;
		position: relative;
		min-height: 0;
	}

	.ml-data-grid__viewport::-webkit-scrollbar {
		width: 6px;
		height: 6px;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-track {
		background: transparent;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-thumb {
		background: var(--ml-color-border);
		border-radius: 3px;
	}

	.ml-data-grid__viewport::-webkit-scrollbar-thumb:hover {
		background: var(--ml-color-text-muted);
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
		background: var(--ml-color-surface-sunken);
		border-bottom: var(--ml-border) solid var(--ml-color-border);
	}

	/* ── Filter row — sticky below header ── */
	.ml-data-grid__filter-row {
		display: grid;
		position: sticky;
		top: var(--ml-grid-header-h, 40px);
		z-index: 2;
		background: var(--ml-color-surface);
		border-bottom: var(--ml-border) solid var(--ml-color-border);
		padding: var(--ml-space-2) 0;
	}

	/* ── Header cells ── */
	.ml-data-grid__th {
		position: relative;
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-xs);
		font-weight: var(--ml-font-medium);
		color: var(--ml-color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		user-select: none;
		background: var(--ml-color-surface-sunken);
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
		color: var(--ml-color-text);
	}

	.ml-data-grid__th--sorted {
		color: var(--ml-color-text);
	}

	.ml-data-grid__th--drag-over {
		background: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.08));
		color: var(--ml-color-primary);
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
		color: var(--ml-color-text-muted);
	}

	.ml-data-grid__th--sorted .ml-data-grid__sort-icon {
		color: var(--ml-color-primary);
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
		background: var(--ml-color-primary);
	}

	/* ── Filter cells ── */
	/* All cells are position: relative so they're "positioned" within the      */
	/* filter row's stacking context — mirrors .ml-data-grid__th behaviour.    */
	.ml-data-grid__filter-cell {
		display: flex;
		align-items: center;
		padding: 0 var(--ml-space-2);
		background: var(--ml-color-surface);
		position: relative;
	}

	.ml-data-grid__filter-cell--pinned-left {
		position: sticky;
		z-index: 3;
		background: var(--ml-color-surface);
	}

	.ml-data-grid__filter-input {
		width: 100%;
		padding: var(--ml-space-1-5) var(--ml-space-2);
		font-size: var(--ml-text-xs);
		font-family: var(--ml-font-sans);
		color: var(--ml-color-text);
		background: var(--ml-color-surface-sunken);
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-sm);
		outline: none;
		transition: border-color var(--ml-duration-150);
	}

	.ml-data-grid__filter-input::placeholder {
		color: var(--ml-color-text-muted);
	}

	.ml-data-grid__filter-input:focus {
		border-color: var(--ml-color-primary);
		box-shadow: 0 0 0 2px var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.12));
	}

	/* ── Virtual scroll spacers ── */
	.ml-data-grid__top-spacer,
	.ml-data-grid__bottom-spacer {
		display: block;
	}

	/* ── Data rows ── */
	.ml-data-grid__row {
		display: grid;
		border-bottom: var(--ml-border) solid var(--ml-color-border);
		transition: background-color var(--ml-duration-150) var(--ml-ease-in-out);
		cursor: default;
	}

	.ml-data-grid__row:last-child {
		border-bottom: none;
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover {
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-data-grid__row--selected {
		background-color: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04));
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover {
		background-color: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.07));
	}

	.ml-data-grid--striped .ml-data-grid__row--even {
		background-color: var(--ml-color-surface-sunken);
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover {
		background-color: var(--ml-color-surface-raised);
	}

	/* ── Data cells ── */
	.ml-data-grid__td {
		padding: var(--ml-space-3) var(--ml-space-4);
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text);
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
		background: var(--ml-color-surface);
	}

	.ml-data-grid__header-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-color-surface-sunken);
	}

	.ml-data-grid__filter-row .ml-data-grid__check-cell {
		z-index: 3;
		background: var(--ml-color-surface);
	}

	.ml-data-grid--sm .ml-data-grid__check-cell {
		padding: var(--ml-space-2);
	}

	.ml-data-grid__checkbox {
		width: 1rem;
		height: 1rem;
		accent-color: var(--ml-color-primary);
		cursor: pointer;
		margin: 0;
		flex-shrink: 0;
	}

	/* ── Pinned columns ── */
	.ml-data-grid__th--pinned-left,
	.ml-data-grid__td--pinned-left {
		position: sticky;
		z-index: 1;
		background: var(--ml-color-surface);
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-left {
		z-index: 3;
		background: var(--ml-color-surface-sunken);
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
		background: var(--ml-color-surface);
	}

	.ml-data-grid__header-row .ml-data-grid__th--pinned-right {
		z-index: 3;
		background: var(--ml-color-surface-sunken);
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
		background: var(--ml-color-surface-sunken);
	}

	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row:hover .ml-data-grid__check-cell {
		background: var(--ml-color-surface-sunken);
	}

	.ml-data-grid__row--selected .ml-data-grid__td--pinned-left,
	.ml-data-grid__row--selected .ml-data-grid__td--pinned-right,
	.ml-data-grid__row--selected .ml-data-grid__check-cell {
		background: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.04));
	}

	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--hoverable .ml-data-grid__row--selected:hover .ml-data-grid__check-cell {
		background: var(--ml-color-primary-subtle, rgba(99, 102, 241, 0.07));
	}

	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-left,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__td--pinned-right,
	.ml-data-grid--striped.ml-data-grid--hoverable .ml-data-grid__row--even:hover .ml-data-grid__check-cell {
		background: var(--ml-color-surface-raised);
	}

	/* ── Footer / Pagination ── */
	.ml-data-grid__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--ml-space-4);
		padding: var(--ml-space-3) var(--ml-space-6);
		border-top: var(--ml-border) solid var(--ml-color-border);
		background: var(--ml-color-surface);
		flex-shrink: 0;
	}

	.ml-data-grid--sm .ml-data-grid__footer {
		padding: var(--ml-space-2) var(--ml-space-4);
	}

	.ml-data-grid__footer-count {
		font-size: var(--ml-text-sm);
		color: var(--ml-color-text-muted);
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
		color: var(--ml-color-text-muted);
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
		border: var(--ml-border) solid var(--ml-color-border);
		border-radius: var(--ml-radius-md);
		background: var(--ml-color-surface);
		color: var(--ml-color-text-muted);
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
		background: var(--ml-color-surface-sunken);
		color: var(--ml-color-text);
		border-color: var(--ml-color-border-strong);
	}

	.ml-data-grid__page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`;
