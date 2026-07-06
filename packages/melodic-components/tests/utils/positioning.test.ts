import { describe, it, expect, vi, afterEach } from 'vitest';
import { computePosition, autoUpdate, offset, flip, shift, arrow } from '../../src/utils/positioning/index';

/** Create an element whose getBoundingClientRect returns a fixed rect. */
function makeElement(rect: { x: number; y: number; width: number; height: number }): HTMLElement {
	const el = document.createElement('div');
	document.body.appendChild(el);
	el.getBoundingClientRect = () =>
		({
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
			top: rect.y,
			left: rect.x,
			right: rect.x + rect.width,
			bottom: rect.y + rect.height,
			toJSON: () => ({})
		}) as DOMRect;
	return el;
}

const vw = window.innerWidth;
const vh = window.innerHeight;

afterEach(() => {
	document.body.innerHTML = '';
});

describe('shift() middleware', () => {
	it('clamps the cross (alignment) axis by default', () => {
		// Reference at the far left edge; centered floating would go negative on X.
		const reference = makeElement({ x: 0, y: 100, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 200, height: 50 });

		const { x } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [shift({ padding: 8 })]
		});

		expect(x).toBe(8);
	});

	it('does NOT clamp the main (side) axis by default — flip owns side overflow', () => {
		// Reference near the bottom edge; bottom placement overflows the viewport.
		const reference = makeElement({ x: 100, y: vh - 30, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 40, height: 100 });

		const { y } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [shift({ padding: 8 })]
		});

		// y must remain below the trigger (reference bottom), not be pulled up over it.
		expect(y).toBe(vh - 10);
	});

	it('clamps the main axis when mainAxis: true is set explicitly', () => {
		const reference = makeElement({ x: 100, y: vh - 30, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 40, height: 100 });

		const { y } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [shift({ padding: 8, mainAxis: true })]
		});

		expect(y).toBe(vh - 100 - 8);
	});

	it('crossAxis: false disables alignment-axis clamping', () => {
		const reference = makeElement({ x: 0, y: 100, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 200, height: 50 });

		const { x } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [shift({ padding: 8, crossAxis: false })]
		});

		// Centered: ref.left + (ref.width - floating.width) / 2 = 0 + (40 - 200)/2
		expect(x).toBe(-80);
	});

	it('maps axes correctly for left/right placements (cross axis is Y)', () => {
		// Right placement, reference near the top edge; centered floating goes negative on Y.
		const reference = makeElement({ x: 100, y: 0, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 50, height: 200 });

		const { x, y } = computePosition(reference, floating, {
			placement: 'right',
			middleware: [shift({ padding: 8 })]
		});

		expect(y).toBe(8); // cross axis (Y) clamped
		expect(x).toBe(140); // main axis (X) untouched
	});
});

describe('flip() middleware', () => {
	it('flips to the opposite placement on overflow', () => {
		// Reference near the bottom; bottom placement overflows, top fits.
		const reference = makeElement({ x: 100, y: vh - 30, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 40, height: 100 });

		const { y, placement } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [flip()]
		});

		expect(placement).toBe('top');
		expect(y).toBe(vh - 30 - 100);
	});

	it('preserves a prior offset() on the flipped placement', () => {
		const reference = makeElement({ x: 100, y: vh - 30, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 40, height: 100 });

		const { y, placement } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [offset(8), flip()]
		});

		expect(placement).toBe('top');
		// Flipped to top WITH the 8px gap: ref.top - height - 8
		expect(y).toBe(vh - 30 - 100 - 8);
	});

	it('keeps the original placement (with offset) when nothing fits', () => {
		// Tiny viewport band: overflows both top and bottom.
		const reference = makeElement({ x: 100, y: 10, width: 40, height: vh - 20 });
		const floating = makeElement({ x: 0, y: 0, width: 40, height: 100 });

		const { y, placement } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [offset(8), flip()]
		});

		expect(placement).toBe('bottom');
		expect(y).toBe(10 + (vh - 20) + 8);
	});
});

describe('computePosition middlewareData accumulation', () => {
	it('merges middlewareData across middleware instead of replacing it', () => {
		const reference = makeElement({ x: 100, y: 100, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 80, height: 40 });
		const arrowEl = makeElement({ x: 0, y: 0, width: 8, height: 8 });

		const { middlewareData } = computePosition(reference, floating, {
			placement: 'bottom',
			middleware: [offset(8), arrow({ element: arrowEl })]
		});

		// offset's recorded data must survive arrow's middlewareData result.
		expect(middlewareData.offset).toEqual({ mainAxis: 8, crossAxis: 0 });
		expect(middlewareData.arrow).toBeDefined();
	});
});

describe('autoUpdate()', () => {
	it('runs an initial update() synchronously', () => {
		const reference = makeElement({ x: 0, y: 0, width: 10, height: 10 });
		const floating = makeElement({ x: 0, y: 0, width: 10, height: 10 });
		const update = vi.fn();

		const cleanup = autoUpdate(reference, floating, update);

		expect(update).toHaveBeenCalledTimes(1);
		cleanup();
	});

	it('updates on window scroll and stops after cleanup', () => {
		const reference = makeElement({ x: 0, y: 0, width: 10, height: 10 });
		const floating = makeElement({ x: 0, y: 0, width: 10, height: 10 });
		const update = vi.fn();

		const cleanup = autoUpdate(reference, floating, update);
		update.mockClear();

		window.dispatchEvent(new Event('scroll'));
		expect(update).toHaveBeenCalledTimes(1);

		cleanup();
		window.dispatchEvent(new Event('scroll'));
		expect(update).toHaveBeenCalledTimes(1);
	});
});
