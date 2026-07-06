import type { Middleware } from '../types.js';
import { getSide } from '../compute-position.js';

export interface ShiftOptions {
	/** Padding from viewport edges */
	padding?: number;
	/**
	 * Shift along the placement's main axis (the side axis: y for top/bottom
	 * placements, x for left/right). Default false — clamping this axis pulls
	 * the floating element over its trigger; let flip() handle side overflow.
	 */
	mainAxis?: boolean;
	/**
	 * Shift along the cross (alignment) axis (x for top/bottom placements,
	 * y for left/right). Default true.
	 */
	crossAxis?: boolean;
}

/**
 * Shift middleware - shifts the floating element to keep it in view.
 *
 * By default only the cross (alignment) axis is shifted; the main axis is
 * left to flip() so the element is never pulled over its trigger.
 */
export function shift(options: ShiftOptions = {}): Middleware {
	const { padding = 0, mainAxis = false, crossAxis = true } = options;

	return {
		name: 'shift',
		fn(state) {
			const { x, y, placement, rects } = state;
			const viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};

			const side = getSide(placement);
			const isVerticalPlacement = side === 'top' || side === 'bottom';

			// For top/bottom placements the cross (alignment) axis is X and the
			// main (side) axis is Y; for left/right placements it's the reverse.
			const shiftX = isVerticalPlacement ? crossAxis : mainAxis;
			const shiftY = isVerticalPlacement ? mainAxis : crossAxis;

			let newX = x;
			let newY = y;

			if (shiftX) {
				const minX = padding;
				const maxX = viewport.width - rects.floating.width - padding;
				newX = Math.max(minX, Math.min(newX, maxX));
			}

			if (shiftY) {
				const minY = padding;
				const maxY = viewport.height - rects.floating.height - padding;
				newY = Math.max(minY, Math.min(newY, maxY));
			}

			return { x: newX, y: newY };
		}
	};
}
