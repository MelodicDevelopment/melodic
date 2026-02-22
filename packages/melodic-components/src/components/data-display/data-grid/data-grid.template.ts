import { html, classMap, when, repeat } from '@melodicdev/core';
import type { DataGridComponent } from './data-grid.component.js';
import type { DataGridColumn } from './data-grid.types.js';

function renderCell(col: DataGridColumn, row: Record<string, unknown>, index: number) {
	if (col.render) return col.render(row[col.key], row, index);
	const val = row[col.key];
	return val == null ? '' : val;
}

export function dataGridTemplate(c: DataGridComponent) {
	const gtc = c.gridTemplateColumns;
	const totalW = c.totalGridWidth;

	return html`
		<div class=${classMap({
			'ml-data-grid': true,
			[`ml-data-grid--${c.size}`]: true,
			'ml-data-grid--striped': c.striped,
			'ml-data-grid--hoverable': c.hoverable,
			'ml-data-grid--selectable': c.selectable,
			'ml-data-grid--virtual': c.virtual
		})}>

			${when(!!c.gridTitle || !!c.description, () => html`
				<div class="ml-data-grid__toolbar">
					<div class="ml-data-grid__toolbar-text">
						${when(!!c.gridTitle, () => html`<h3 class="ml-data-grid__title">${c.gridTitle}</h3>`)}
						${when(!!c.description, () => html`<p class="ml-data-grid__description">${c.description}</p>`)}
					</div>
					<slot name="toolbar-actions"></slot>
				</div>
			`)}

			<div class="ml-data-grid__viewport">
				<div class="ml-data-grid__inner" style="min-width: ${totalW}px">

					<!-- Header row -->
					<div class="ml-data-grid__header-row" style="grid-template-columns: ${gtc}">
						${when(c.selectable, () => html`
							<div class="ml-data-grid__th ml-data-grid__check-cell">
								<input
									type="checkbox"
									class="ml-data-grid__checkbox"
									.checked=${c.allSelected}
									.indeterminate=${c.someSelected}
									@change=${c.handleSelectAll}
									aria-label="Select all rows"
								/>
							</div>
						`)}
						${repeat(c.orderedColumns, (col: DataGridColumn) => col.key, (col: DataGridColumn) => html`
							<div
								class=${classMap({
									'ml-data-grid__th': true,
									[`ml-data-grid__th--${col.align ?? 'left'}`]: true,
									'ml-data-grid__th--sortable': !!col.sortable,
									'ml-data-grid__th--sorted': c.sortKey === col.key,
									'ml-data-grid__th--pinned-left': col.pinned === 'left',
									'ml-data-grid__th--pinned-right': col.pinned === 'right',
									'ml-data-grid__th--drag-over': c.dragOverKey === col.key,
									'ml-data-grid__th--dragging': c.draggingKey === col.key,
									'ml-data-grid__th--resizing': c.resizingKey === col.key
								})}
								style=${col.pinned === 'left' ? `left: ${c.getPinnedLeftOffset(col.key)}px` : ''}
								draggable=${col.reorderable !== false ? 'true' : 'false'}
								@dragstart=${(e: DragEvent) => c.handleDragStart(col.key, e)}
								@dragover=${(e: DragEvent) => c.handleDragOver(col.key, e)}
								@dragend=${c.handleDragEnd}
								@drop=${() => c.handleDrop(col.key)}
								@click=${() => c.handleSort(col)}
								aria-sort=${c.sortKey === col.key
									? (c.sortDirection === 'asc' ? 'ascending' : 'descending')
									: 'none'}
							>
								<span class="ml-data-grid__th-content">
									${col.label}
									${when(!!col.sortable, () => html`
										<span class="ml-data-grid__sort-icon">
											${c.sortKey === col.key
												? (c.sortDirection === 'asc'
													? html`<ml-icon icon="caret-up" size="xs"></ml-icon>`
													: html`<ml-icon icon="caret-down" size="xs"></ml-icon>`)
												: html`<ml-icon icon="caret-up-down" size="xs"></ml-icon>`
											}
										</span>
									`)}
								</span>
								${when(col.resizable !== false, () => html`
									<div
										class="ml-data-grid__resize-handle"
										@pointerdown=${(e: PointerEvent) => c.handleResizeStart(col.key, e)}
										@pointermove=${(e: PointerEvent) => c.handleResizeMove(col.key, e)}
										@pointerup=${c.handleResizeEnd}
									></div>
								`)}
							</div>
						`)}
					</div>

					<!-- Filter row -->
					${when(c.showFilterRow, () => html`
						<div class="ml-data-grid__filter-row" style="grid-template-columns: ${gtc}">
							${when(c.selectable, () => html`
								<div class="ml-data-grid__filter-cell ml-data-grid__check-cell"></div>
							`)}
							${repeat(c.orderedColumns, (col: DataGridColumn) => col.key, (col: DataGridColumn) => html`
								<div
									class=${classMap({
										'ml-data-grid__filter-cell': true,
										'ml-data-grid__filter-cell--pinned-left': col.pinned === 'left'
									})}
									style=${col.pinned === 'left' ? `left: ${c.getPinnedLeftOffset(col.key)}px` : ''}
								>
									${when(!!col.filterable, () => html`
										<input
											type="text"
											class="ml-data-grid__filter-input"
											placeholder="Filter..."
											.value=${c.filters[col.key] ?? ''}
											@input=${(e: Event) => c.handleFilterInput(col.key, e)}
										/>
									`)}
								</div>
							`)}
						</div>
					`)}

					<!-- Virtual top spacer -->
					${when(c.virtual && c.topSpacerHeight > 0, () => html`
						<div class="ml-data-grid__top-spacer" style="height: ${c.topSpacerHeight}px"></div>
					`)}

					<!-- Data rows -->
					${repeat(
						c.visibleRows,
						(_: Record<string, unknown>, i: number) => c.startIndex + i,
						(row: Record<string, unknown>, i: number) => html`
							<div
								class=${classMap({
									'ml-data-grid__row': true,
									'ml-data-grid__row--selected': c.isRowSelected(c.startIndex + i),
									'ml-data-grid__row--even': (c.startIndex + i) % 2 === 1
								})}
								style="grid-template-columns: ${gtc}"
								@click=${() => c.handleRowClick(row, c.startIndex + i)}
							>
								${when(c.selectable, () => html`
									<div class="ml-data-grid__td ml-data-grid__check-cell">
										<input
											type="checkbox"
											class="ml-data-grid__checkbox"
											.checked=${c.isRowSelected(c.startIndex + i)}
											@change=${(e: Event) => c.handleSelectRow(c.startIndex + i, e)}
											@click=${(e: Event) => e.stopPropagation()}
											aria-label=${`Select row ${c.startIndex + i + 1}`}
										/>
									</div>
								`)}
								${repeat(c.orderedColumns, (col: DataGridColumn) => col.key, (col: DataGridColumn) => html`
									<div
										class=${classMap({
											'ml-data-grid__td': true,
											[`ml-data-grid__td--${col.align ?? 'left'}`]: true,
											'ml-data-grid__td--pinned-left': col.pinned === 'left',
											'ml-data-grid__td--pinned-right': col.pinned === 'right'
										})}
										style=${col.pinned === 'left' ? `left: ${c.getPinnedLeftOffset(col.key)}px` : ''}
									>
										${renderCell(col, row, c.startIndex + i)}
									</div>
								`)}
							</div>
						`
					)}

					<!-- Virtual bottom spacer -->
					${when(c.virtual && c.bottomSpacerHeight > 0, () => html`
						<div class="ml-data-grid__bottom-spacer" style="height: ${c.bottomSpacerHeight}px"></div>
					`)}

				</div>
			</div>

			<!-- Footer / Pagination -->
			<div class="ml-data-grid__footer">
				<span class="ml-data-grid__footer-count">
					${when(
						c.selectable && c.selectedIndices.length > 0,
						() => html`${c.selectedIndices.length} of ${c.totalRows} rows selected`,
						() => html`${c.totalRows} rows`
					)}
				</span>
				<div class="ml-data-grid__footer-pagination">
					${when(c.totalPages > 1, () => html`
						<span class="ml-data-grid__page-info">Page ${c.currentPage} of ${c.totalPages}</span>
						<div class="ml-data-grid__page-controls">
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === 1}
								@click=${() => c.goToPage(1)}
								aria-label="First page"
							><ml-icon icon="caret-double-left" size="xs"></ml-icon></button>
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === 1}
								@click=${() => c.goToPage(c.currentPage - 1)}
								aria-label="Previous page"
							><ml-icon icon="caret-left" size="xs"></ml-icon></button>
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === c.totalPages}
								@click=${() => c.goToPage(c.currentPage + 1)}
								aria-label="Next page"
							><ml-icon icon="caret-right" size="xs"></ml-icon></button>
							<button
								class="ml-data-grid__page-btn"
								.disabled=${c.currentPage === c.totalPages}
								@click=${() => c.goToPage(c.totalPages)}
								aria-label="Last page"
							><ml-icon icon="caret-double-right" size="xs"></ml-icon></button>
						</div>
					`)}
				</div>
			</div>

		</div>
	`;
}
