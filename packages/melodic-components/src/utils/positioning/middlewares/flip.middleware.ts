import type { Middleware, Placement } from '../types.js';
import { getOppositePlacement, getSide } from '../compute-position.js';

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
			const { x, y, placement, rects } = state;
			const side = getSide(placement);
			const overflow = detectOverflow(x, y, rects.floating, padding);

			// Check if current placement has overflow
			if (!hasOverflow(overflow, side)) {
				return;
			}

			// Try opposite placement
			const oppositePlacement = getOppositePlacement(placement);
			const fallbacks = options.fallbackPlacements ?? [oppositePlacement];

			for (const fallback of fallbacks) {
				// Calculate position for fallback placement
				const newPos = getBasePlacementForFlip(rects.reference, rects.floating, fallback);
				const newOverflow = detectOverflow(newPos.x, newPos.y, rects.floating, padding);
				const newSide = getSide(fallback);

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

/**
 * Calculate base position for a placement (used internally by flip)
 */
function getBasePlacementForFlip(reference: DOMRect, floating: DOMRect, placement: Placement): { x: number; y: number } {
	const [side, alignment = 'center'] = placement.split('-') as [string, string?];

	let x = 0;
	let y = 0;

	switch (side) {
		case 'top':
			y = reference.top - floating.height;
			break;
		case 'bottom':
			y = reference.bottom;
			break;
		case 'left':
			x = reference.left - floating.width;
			break;
		case 'right':
			x = reference.right;
			break;
	}

	if (side === 'top' || side === 'bottom') {
		switch (alignment) {
			case 'start':
				x = reference.left;
				break;
			case 'end':
				x = reference.right - floating.width;
				break;
			default:
				x = reference.left + (reference.width - floating.width) / 2;
		}
	} else {
		switch (alignment) {
			case 'start':
				y = reference.top;
				break;
			case 'end':
				y = reference.bottom - floating.height;
				break;
			default:
				y = reference.top + (reference.height - floating.height) / 2;
		}
	}

	return { x, y };
}
