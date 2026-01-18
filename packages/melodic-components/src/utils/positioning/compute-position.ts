import type { Placement, Position, ComputePositionConfig, ComputePositionReturn, MiddlewareState } from './types.js';

/**
 * Get the base position for a given placement
 */
function getBasePlacement(reference: DOMRect, floating: DOMRect, placement: Placement): Position {
	const [side, alignment = 'center'] = placement.split('-') as [string, string?];

	let x = 0;
	let y = 0;

	// Main axis positioning
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
		default:
			break;
	}

	// Cross axis alignment
	if (side === 'top' || side === 'bottom') {
		switch (alignment) {
			case 'start':
				x = reference.left;
				break;
			case 'end':
				x = reference.right - floating.width;
				break;
			default:
				// center
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
				// center
				y = reference.top + (reference.height - floating.height) / 2;
		}
	}

	return { x, y };
}

/**
 * Compute the position of a floating element relative to a reference element
 */
export function computePosition(reference: Element, floating: HTMLElement, config: ComputePositionConfig = {}): ComputePositionReturn {
	const { placement = 'bottom', middleware = [] } = config;

	const referenceRect = reference.getBoundingClientRect();
	const floatingRect = floating.getBoundingClientRect();

	// Calculate base position from placement
	const { x, y } = getBasePlacement(referenceRect, floatingRect, placement);

	// Apply middlewares
	let state: MiddlewareState = {
		x,
		y,
		placement,
		rects: { reference: referenceRect, floating: floatingRect },
		elements: { reference, floating },
		middlewareData: {}
	};

	for (const mw of middleware) {
		const result = mw.fn(state);
		if (result) {
			state = { ...state, ...result };
			if (result.middlewareData) {
				state.middlewareData = { ...state.middlewareData, ...result.middlewareData };
			}
		}
	}

	return {
		x: state.x,
		y: state.y,
		placement: state.placement,
		middlewareData: state.middlewareData
	};
}

/**
 * Get the opposite placement
 */
export function getOppositePlacement(placement: Placement): Placement {
	const opposites: Record<string, string> = {
		top: 'bottom',
		bottom: 'top',
		left: 'right',
		right: 'left'
	};

	return placement.replace(/top|bottom|left|right/g, (match) => opposites[match]) as Placement;
}

/**
 * Get the side from a placement
 */
export function getSide(placement: Placement): 'top' | 'right' | 'bottom' | 'left' {
	return placement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left';
}
