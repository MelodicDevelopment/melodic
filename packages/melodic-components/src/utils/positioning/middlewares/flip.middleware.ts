import type { Middleware, Placement } from '../types.js';
import { getBasePlacement, getOppositePlacement, getSide } from '../compute-position.js';
import { applyOffsetToPosition, type OffsetMiddlewareData } from './offset.middleware.js';

export interface FlipOptions {
	/** Custom fallback placements to try */
	fallbackPlacements?: Placement[];
	/** Padding from viewport edges */
	padding?: number;
}

interface Overflow {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/**
 * Detect overflow relative to viewport
 */
function detectOverflow(x: number, y: number, floating: DOMRect, padding: number): Overflow {
	const viewport = {
		width: window.innerWidth,
		height: window.innerHeight
	};

	return {
		top: padding - y,
		right: x + floating.width - viewport.width + padding,
		bottom: y + floating.height - viewport.height + padding,
		left: padding - x
	};
}

/**
 * Check if there's any overflow on the main side
 */
function hasOverflow(overflow: Overflow, side: string): boolean {
	switch (side) {
		case 'top':
			return overflow.top > 0;
		case 'bottom':
			return overflow.bottom > 0;
		case 'left':
			return overflow.left > 0;
		case 'right':
			return overflow.right > 0;
		default:
			return false;
	}
}

/**
 * Flip middleware - flips placement when there's overflow
 */
export function flip(options: FlipOptions = {}): Middleware {
	const { padding = 0 } = options;

	return {
		name: 'flip',
		fn(state) {
			const { x, y, placement, rects, middlewareData } = state;
			const side = getSide(placement);
			const overflow = detectOverflow(x, y, rects.floating, padding);

			// Check if current placement has overflow
			if (!hasOverflow(overflow, side)) {
				return;
			}

			// An earlier offset() records its amounts in middlewareData; re-apply
			// them for each fallback so flipping preserves the configured gap.
			const offsetData = middlewareData.offset as OffsetMiddlewareData | undefined;

			// Try opposite placement
			const oppositePlacement = getOppositePlacement(placement);
			const fallbacks = options.fallbackPlacements ?? [oppositePlacement];

			for (const fallback of fallbacks) {
				// Calculate position for fallback placement
				const newSide = getSide(fallback);
				let newPos = getBasePlacement(rects.reference, rects.floating, fallback);
				if (offsetData) {
					newPos = applyOffsetToPosition(newPos, newSide, offsetData);
				}
				const newOverflow = detectOverflow(newPos.x, newPos.y, rects.floating, padding);

				if (!hasOverflow(newOverflow, newSide)) {
					return {
						x: newPos.x,
						y: newPos.y,
						placement: fallback
					};
				}
			}

			// If no fallback works, keep original
			return;
		}
	};
}
