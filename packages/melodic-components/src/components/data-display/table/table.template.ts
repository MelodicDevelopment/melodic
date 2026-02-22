import { html, classMap, when, repeat } from '@melodicdev/core';
import type { TableComponent } from './table.component.js';
import type { TableColumn } from './table.types.js';

function renderCell(column: TableColumn, row: Record<string, unknown>, index: number) {
	if (column.render) {
		return column.render(row[column.key], row, index);
	}
	return row[column.key] ?? '';
}

export function tableTemplate(c: TableComponent) {
	return html`
		<div class=${classMap({
			'ml-table': true,
			[`ml-table--${c.size}`]: true,
			'ml-table--striped': c.striped,
			'ml-table--hoverable': c.hoverable,
			'ml-table--sticky-header': c.stickyHeader,
			'ml-table--virtual': c.virtual
		})}>
			${when(!!c.tableTitle || !!c.description, () => html`
				<div class="ml-table__header">
					<div class="ml-table__header-text">
						${when(!!c.tableTitle, () => html`<h3 class="ml-table__title">${c.tableTitle}</h3>`)}
						${when(!!c.description, () => html`<p class="ml-table__description">${c.description}</p>`)}
					</div>
					<slot name="header-actions"></slot>
				</div>
			`)}

			<div class="ml-table__wrapper">
				<table role="grid">
					<thead>
						<tr>
							${when(c.selectable, () => html`
								<th class="ml-table__check-cell">
									<input
										type="checkbox"
										class="ml-table__checkbox"
										.checked=${c.allSelected}
										.indeterminate=${c.someSelected}
										@change=${c.handleSelectAll}
										aria-label="Select all rows"
									/>
								</th>
							`)}
							${repeat(c.columns, (col: TableColumn) => col.key, (col: TableColumn) => html`
								<th
									class=${classMap({
										'ml-table__th': true,
										'ml-table__th--sortable': !!col.sortable,
										'ml-table__th--sorted': c.sortKey === col.key,
										[`ml-table__th--${col.align ?? 'left'}`]: true
									})}
									style=${col.width ? `width: ${col.width}` : ''}
									@click=${() => c.handleSort(col)}
									aria-sort=${c.sortKey === col.key ? (c.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
								>
									<span class="ml-table__th-content">
										${col.label}
										${when(!!col.sortable, () => html`
											<span class="ml-table__sort-icon">
												${c.sortKey === col.key
													? (c.sortDirection === 'asc'
														? html`<ml-icon icon="caret-up" size="xs"></ml-icon>`
														: html`<ml-icon icon="caret-down" size="xs"></ml-icon>`)
													: html`<ml-icon icon="caret-up-down" size="xs"></ml-icon>`
												}
											</span>
										`)}
									</span>
								</th>
							`)}
						</tr>
					</thead>
					<tbody>
						${when(c.virtual && c.topSpacerHeight > 0, () => html`
							<tr class="ml-table__spacer">
								<td colspan="${c.colCount}" style="height: ${c.topSpacerHeight}px"></td>
							</tr>
						`)}
						${repeat(c.visibleRows, (_: Record<string, unknown>, i: number) => c.startIndex + i, (row: Record<string, unknown>, i: number) => {
							const absoluteIndex = c.startIndex + i;
							return html`
								<tr
									class=${classMap({
										'ml-table__row': true,
										'ml-table__row--selected': c.isRowSelected(absoluteIndex)
									})}
									@click=${() => c.handleRowClick(row, absoluteIndex)}
								>
									${when(c.selectable, () => html`
										<td class="ml-table__check-cell">
											<input
												type="checkbox"
												class="ml-table__checkbox"
												.checked=${c.isRowSelected(absoluteIndex)}
												@change=${(e: Event) => c.handleSelectRow(absoluteIndex, e)}
												@click=${(e: Event) => e.stopPropagation()}
												aria-label=${`Select row ${absoluteIndex + 1}`}
											/>
										</td>
									`)}
									${repeat(c.columns, (col: TableColumn) => col.key, (col: TableColumn) => html`
										<td class=${classMap({
											'ml-table__td': true,
											[`ml-table__td--${col.align ?? 'left'}`]: true
										})}>
											${renderCell(col, row, absoluteIndex)}
										</td>
									`)}
								</tr>
							`;
						})}
						${when(c.virtual && c.bottomSpacerHeight > 0, () => html`
							<tr class="ml-table__spacer">
								<td colspan="${c.colCount}" style="height: ${c.bottomSpacerHeight}px"></td>
							</tr>
						`)}
					</tbody>
				</table>
			</div>

			<div class=${classMap({
				'ml-table__footer': true,
				'ml-table__footer--visible': c.hasFooter
			})}>
				<slot name="footer"></slot>
			</div>
		</div>
	`;
}
