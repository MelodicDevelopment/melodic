import { MelodicComponent } from '@melodicdev/core';
import type { IElementRef } from '@melodicdev/core';
import { paginationTemplate } from './pagination.template.js';
import { paginationStyles } from './pagination.styles.js';

export type PaginationPage = { type: 'page'; value: number } | { type: 'ellipsis' };

/**
 * ml-pagination - Page navigation controls
 *
 * @example
 * ```html
 * <ml-pagination page="1" total-pages="10"></ml-pagination>
 * <ml-pagination page="5" total-pages="20" siblings="2"></ml-pagination>
 * ```
 *
 * @fires ml:page-change - Emitted when page changes, detail: { page }
 */
@MelodicComponent({
	selector: 'ml-pagination',
	template: paginationTemplate,
	styles: paginationStyles,
	attributes: ['page', 'total-pages', 'siblings']
})
export class PaginationComponent implements IElementRef {
	elementRef!: HTMLElement;

	/** Current active page (1-based) */
	page = 1;

	/** Total number of pages */
	totalPages = 1;

	/** Number of sibling pages to show around current */
	siblings = 1;

	get pages(): PaginationPage[] {
		const total = Math.max(1, this.totalPages);
		const current = Math.min(Math.max(1, this.page), total);
		const siblings = Math.max(0, this.siblings);

		const range = (start: number, end: number) =>
			Array.from({ length: end - start + 1 }, (_, i): PaginationPage => ({ type: 'page', value: start + i }));

		const leftSibling = Math.max(current - siblings, 1);
		const rightSibling = Math.min(current + siblings, total);

		const showLeftEllipsis = leftSibling > 2;
		const showRightEllipsis = rightSibling < total - 1;

		if (!showLeftEllipsis && !showRightEllipsis) {
			return range(1, total);
		}

		if (!showLeftEllipsis && showRightEllipsis) {
			const leftRange = range(1, Math.max(rightSibling, 3 + siblings));
			return [...leftRange, { type: 'ellipsis' }, { type: 'page', value: total }];
		}

		if (showLeftEllipsis && !showRightEllipsis) {
			const rightRange = range(Math.min(leftSibling, total - 2 - siblings), total);
			return [{ type: 'page', value: 1 }, { type: 'ellipsis' }, ...rightRange];
		}

		return [
			{ type: 'page', value: 1 },
			{ type: 'ellipsis' },
			...range(leftSibling, rightSibling),
			{ type: 'ellipsis' },
			{ type: 'page', value: total }
		];
	}

	get hasPrevious(): boolean {
		return this.page > 1;
	}

	get hasNext(): boolean {
		return this.page < this.totalPages;
	}

	goToPage = (page: number): void => {
		if (page < 1 || page > this.totalPages || page === this.page) return;

		this.page = page;
		this.elementRef.dispatchEvent(
			new CustomEvent('ml:page-change', {
				bubbles: true,
				composed: true,
				detail: { page: this.page }
			})
		);
	};

	previous = (): void => {
		this.goToPage(this.page - 1);
	};

	next = (): void => {
		this.goToPage(this.page + 1);
	};
}
