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
			}

			return { x: newX, y: newY };
		}
	};
}
