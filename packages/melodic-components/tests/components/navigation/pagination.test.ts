import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/navigation/pagination/pagination.component';
import type { PaginationPage } from '../../../src/components/navigation/pagination/pagination.component';
import { flush, createComponent, removeComponent, shadowQueryAll, captureEvent } from '../../helpers/component-test-utils';

function pageValues(pages: PaginationPage[]): Array<number | '…'> {
	return pages.map((p) => (p.type === 'page' ? p.value : '…'));
}

describe('ml-pagination page list', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	async function pagesFor(page: number, totalPages: number, siblings = 1): Promise<Array<number | '…'>> {
		el = createComponent('ml-pagination', { properties: { page, totalPages, siblings } });
		await flush();
		const result = pageValues(el.pages);
		removeComponent(el);
		el = null;
		return result;
	}

	it('renders all pages without duplicates for page=1 total-pages=4 siblings=1 (reported case)', async () => {
		expect(await pagesFor(1, 4)).toEqual([1, 2, 3, 4]);
	});

	it('renders all pages without a zero-page ellipsis for total-pages=5 (reported case)', async () => {
		expect(await pagesFor(1, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(await pagesFor(3, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(await pagesFor(5, 5)).toEqual([1, 2, 3, 4, 5]);
	});

	it('never emits duplicate page entries for any position (boundary matrix)', async () => {
		for (let total = 1; total <= 12; total++) {
			for (let page = 1; page <= total; page++) {
				const values = (await pagesFor(page, total)).filter((v) => v !== '…') as number[];
				expect(new Set(values).size, `total=${total} page=${page}`).toBe(values.length);
				// First and last page are always present.
				expect(values).toContain(1);
				expect(values).toContain(total);
			}
		}
	});

	it('every ellipsis hides at least one page', async () => {
		for (let total = 1; total <= 15; total++) {
			for (let page = 1; page <= total; page++) {
				const values = await pagesFor(page, total);
				const numbers = values.filter((v) => v !== '…') as number[];
				const ellipses = values.length - numbers.length;
				const hidden = total - numbers.length;
				expect(hidden, `total=${total} page=${page}`).toBeGreaterThanOrEqual(ellipses);
				if (ellipses > 0) {
					expect(hidden).toBeGreaterThan(0);
				}
			}
		}
	});

	it('shows the full range at exactly the 2*siblings+5 boundary and truncates above it', async () => {
		// siblings=1: boundary is 7.
		expect(await pagesFor(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(await pagesFor(4, 8)).toEqual([1, '…', 3, 4, 5, '…', 8]);
		expect(await pagesFor(1, 8)).toEqual([1, 2, 3, 4, '…', 8]);
		expect(await pagesFor(8, 8)).toEqual([1, '…', 5, 6, 7, 8]);
	});

	it('renders unique repeat keys (no duplicate page buttons in the DOM)', async () => {
		el = createComponent('ml-pagination', { properties: { page: 1, totalPages: 4, siblings: 1 } });
		await flush();
		const buttons = shadowQueryAll(el, '.ml-pagination__btn--page');
		const labels = buttons.map((b) => b.textContent?.trim());
		expect(labels).toEqual(['1', '2', '3', '4']);
	});

	it('emits ml:page-change and clamps navigation to valid pages', async () => {
		el = createComponent('ml-pagination', { properties: { page: 1, totalPages: 3 } });
		await flush();

		const eventPromise = captureEvent<{ page: number }>(el, 'ml:page-change');
		el.component.next();
		const event = await eventPromise;
		expect(event.detail.page).toBe(2);

		// Out-of-range navigation is a no-op.
		el.component.goToPage(99);
		expect(el.page).toBe(2);
		el.component.goToPage(0);
		expect(el.page).toBe(2);
	});
});

describe('ml-pagination attribute coercion (declarative propertyTypes)', () => {
	let el: any;

	afterEach(() => {
		if (el) removeComponent(el);
		el = null;
	});

	it('coerces page/total-pages/siblings attributes to numbers', async () => {
		el = createComponent('ml-pagination', {
			attributes: { page: '2', 'total-pages': '9', siblings: '2' }
		});
		await flush();

		expect(el.page).toBe(2);
		expect(el.totalPages).toBe(9);
		expect(el.siblings).toBe(2);
	});

	it('navigates correctly from attribute-provided numbers', async () => {
		el = createComponent('ml-pagination', {
			attributes: { page: '2', 'total-pages': '3' }
		});
		await flush();

		expect(el.hasPrevious).toBe(true);
		expect(el.hasNext).toBe(true);

		const changed = captureEvent<{ page: number }>(el, 'ml:page-change');
		el.component.next();
		expect((await changed).detail.page).toBe(3);
		expect(el.hasNext).toBe(false);
	});

	it('does not navigate past the attribute-coerced bounds', async () => {
		el = createComponent('ml-pagination', {
			attributes: { page: '1', 'total-pages': '2' }
		});
		await flush();

		el.component.previous();
		expect(el.page).toBe(1);

		el.component.next();
		el.component.next();
		expect(el.page).toBe(2);
	});
});
