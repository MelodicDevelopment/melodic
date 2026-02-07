import { html, classMap, repeat } from '@melodicdev/core';
import type { PaginationComponent, PaginationPage } from './pagination.component.js';

export function paginationTemplate(c: PaginationComponent) {
	return html`
		<nav class="ml-pagination" aria-label="Pagination">
			<button
				class=${classMap({
					'ml-pagination__btn': true,
					'ml-pagination__btn--nav': true,
					'ml-pagination__btn--disabled': !c.hasPrevious
				})}
				aria-label="Previous page"
				?disabled=${!c.hasPrevious}
				@click=${c.previous}
			>
				<ml-icon icon="arrow-left" size="sm"></ml-icon>
				Previous
			</button>

			<div class="ml-pagination__pages">
				${repeat(
					c.pages,
					(p: PaginationPage, i: number) => p.type === 'page' ? `page-${p.value}` : `ellipsis-${i}`,
					(p: PaginationPage) => {
						if (p.type === 'ellipsis') {
							return html`<span class="ml-pagination__ellipsis">...</span>`;
						}
						return html`
							<button
								class=${classMap({
									'ml-pagination__btn': true,
									'ml-pagination__btn--page': true,
									'ml-pagination__btn--active': p.value === c.page
								})}
								aria-label=${`Page ${p.value}`}
								aria-current=${p.value === c.page ? 'page' : false}
								@click=${() => c.goToPage(p.value)}
							>
								${p.value}
							</button>
						`;
					}
				)}
			</div>

			<button
				class=${classMap({
					'ml-pagination__btn': true,
					'ml-pagination__btn--nav': true,
					'ml-pagination__btn--disabled': !c.hasNext
				})}
				aria-label="Next page"
				?disabled=${!c.hasNext}
				@click=${c.next}
			>
				Next
				<ml-icon icon="arrow-right" size="sm"></ml-icon>
			</button>
		</nav>
	`;
}
