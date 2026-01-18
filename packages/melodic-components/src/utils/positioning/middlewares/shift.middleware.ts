import type { Middleware } from '../types.js';

export interface ShiftOptions {
	/** Padding from viewport edges */
	padding?: number;
	/** Limit shifting to main axis only */
	mainAxis?: boolean;
	/** Limit shifting to cross axis only */
	crossAxis?: boolean;
}

/**
 * Shift middleware - shifts the floating element to keep it in view
 */
export function shift(options: ShiftOptions = {}): Middleware {
	const { padding = 0, mainAxis = true, crossAxis = true } = options;

	return {
		name: 'shift',
		fn(state) {
			const { x, y, rects } = state;
			const viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};

			let newX = x;
			let newY = y;

			// Clamp X position
			if (crossAxis || mainAxis) {
				const minX = padding;
				const maxX = viewport.width - rects.floating.width - padding;
				newX = Math.max(minX, Math.min(newX, maxX));
			}

			// Clamp Y position
			if (crossAxis || mainAxis) {
				const minY = padding;
				const maxY = viewport.height - rects.floating.height - padding;
				newY = Math.max(minY, Math.min(newY, maxY));
			}

			return { x: newX, y: newY };
		}
	};
}
