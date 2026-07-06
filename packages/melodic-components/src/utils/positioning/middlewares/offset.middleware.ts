import type { Middleware } from '../types.js';
import { getSide } from '../compute-position.js';

export interface OffsetOptions {
	/** Distance from the reference element along the main axis */
	mainAxis?: number;
	/** Distance from the reference element along the cross axis */
	crossAxis?: number;
}

/**
 * Offset middleware - adds distance between reference and floating elements
 */
export function offset(options: number | OffsetOptions = 0): Middleware {
	const mainAxis = typeof options === 'number' ? options : (options.mainAxis ?? 0);
	const crossAxis = typeof options === 'number' ? 0 : (options.crossAxis ?? 0);

	return {
		name: 'offset',
		fn(state) {
			const { x, y, placement } = state;
			const side = getSide(placement);

			let newX = x;
			let newY = y;

			switch (side) {
				case 'top':
					newY -= mainAxis;
					newX += crossAxis;
					break;
				case 'bottom':
					newY += mainAxis;
					newX += crossAxis;
					break;
				case 'left':
					newX -= mainAxis;
					newY += crossAxis;
					break;
				case 'right':
					newX += mainAxis;
					newY += crossAxis;
					break;
				default:
					break;
			}

			// Record the applied offset so later middleware (e.g. flip) can
			// re-apply it when recomputing positions for other placements.
			return { x: newX, y: newY, middlewareData: { offset: { mainAxis, crossAxis } } };
		}
	};
}

/** Offset amounts recorded in middlewareData by the offset middleware. */
export interface OffsetMiddlewareData {
	mainAxis: number;
	crossAxis: number;
}

/**
 * Apply a previously-recorded offset to a base position for the given placement side.
 */
export function applyOffsetToPosition(position: { x: number; y: number }, side: 'top' | 'right' | 'bottom' | 'left', offsetData: OffsetMiddlewareData): { x: number; y: number } {
	const { mainAxis, crossAxis } = offsetData;
	let { x, y } = position;

	switch (side) {
		case 'top':
			y -= mainAxis;
			x += crossAxis;
			break;
		case 'bottom':
			y += mainAxis;
			x += crossAxis;
			break;
		case 'left':
			x -= mainAxis;
			y += crossAxis;
			break;
		case 'right':
			x += mainAxis;
			y += crossAxis;
			break;
		default:
			break;
	}

	return { x, y };
}
