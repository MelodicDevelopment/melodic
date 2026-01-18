import type { Middleware } from '../types.js';
import { getSide } from '../compute-position.js';

export interface ArrowOptions {
	/** The arrow element */
	element: HTMLElement;
	/** Padding from the edges of the floating element */
	padding?: number;
}

/**
 * Arrow middleware - positions an arrow element
 */
export function arrow(options: ArrowOptions): Middleware {
	const { element, padding = 0 } = options;

	return {
		name: 'arrow',
		fn(state) {
			const { rects, placement } = state;
			const side = getSide(placement);

			// Get arrow dimensions
			const arrowRect = element.getBoundingClientRect();
			const arrowWidth = arrowRect.width;
			const arrowHeight = arrowRect.height;

			// Calculate arrow position
			let arrowX: number | undefined;
			let arrowY: number | undefined;

			if (side === 'top' || side === 'bottom') {
				// Horizontal positioning for top/bottom placements
				const referenceCenter = rects.reference.left + rects.reference.width / 2;
				const floatingLeft = state.x;
				arrowX = referenceCenter - floatingLeft - arrowWidth / 2;

				// Clamp to floating element bounds
				const minX = padding;
				const maxX = rects.floating.width - arrowWidth - padding;
				arrowX = Math.max(minX, Math.min(arrowX, maxX));
			} else {
				// Vertical positioning for left/right placements
				const referenceCenter = rects.reference.top + rects.reference.height / 2;
				const floatingTop = state.y;
				arrowY = referenceCenter - floatingTop - arrowHeight / 2;

				// Clamp to floating element bounds
				const minY = padding;
				const maxY = rects.floating.height - arrowHeight - padding;
				arrowY = Math.max(minY, Math.min(arrowY, maxY));
			}

			return {
				middlewareData: {
					arrow: {
						x: arrowX,
						y: arrowY,
						centerOffset: 0
					}
				}
			};
		}
	};
}
