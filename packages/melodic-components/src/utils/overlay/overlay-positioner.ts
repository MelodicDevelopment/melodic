import type { Placement } from '../positioning/types.js';
import { computePosition } from '../positioning/compute-position.js';
import { autoUpdate } from '../positioning/auto-update.js';
import { offset } from '../positioning/middlewares/offset.middleware.js';
import { flip } from '../positioning/middlewares/flip.middleware.js';
import { shift } from '../positioning/middlewares/shift.middleware.js';
import { arrow as arrowMiddleware } from '../positioning/middlewares/arrow.middleware.js';

/**
 * Per-update positioning configuration. Resolved via a callback on every
 * update so reactive component properties (placement, offset, arrow) are
 * always read fresh.
 */
export interface OverlayPositionConfig {
	/** Preferred placement relative to the trigger. */
	placement: Placement;
	/** Gap between trigger and floating element in px (offset middleware). */
	offset: number;
	/** Padding passed to the shift middleware (default: 8). */
	shiftPadding?: number;
	/** Arrow element to position (arrow middleware); omit/null for none. */
	arrowElement?: HTMLElement | null;
	/** Padding passed to the arrow middleware (default: 8). */
	arrowPadding?: number;
	/** Match the floating element's width to the trigger's width (select/autocomplete). */
	matchTriggerWidth?: boolean;
	/** Reflect the resolved placement as `data-placement` on the floating element. */
	placementAttribute?: boolean;
}

/**
 * Shared open/close positioning lifecycle for anchored overlays
 * (popover, dropdown, select, autocomplete, date-picker).
 *
 * Owns the `autoUpdate` subscription: `start()` begins repositioning the
 * floating element against its trigger (initial position + scroll/resize
 * tracking) and `stop()` tears it down. Calling `start()` while already
 * active restarts cleanly; `stop()` is idempotent and doubles as the
 * on-destroy cleanup.
 */
export class OverlayPositioner {
	private _cleanupAutoUpdate: (() => void) | null = null;

	constructor(private readonly _getConfig: () => OverlayPositionConfig) {}

	/** Whether the positioner is currently tracking an open overlay. */
	public get active(): boolean {
		return this._cleanupAutoUpdate !== null;
	}

	/** Begin positioning `floatingEl` against `triggerEl` (positions immediately). */
	public start(triggerEl: HTMLElement, floatingEl: HTMLElement): void {
		this.stop();
		// autoUpdate runs an initial update immediately, then keeps the overlay
		// positioned on scroll/resize while open.
		this._cleanupAutoUpdate = autoUpdate(triggerEl, floatingEl, () => this.position(triggerEl, floatingEl));
	}

	/** Stop positioning. Idempotent; call from close handlers and onDestroy. */
	public stop(): void {
		this._cleanupAutoUpdate?.();
		this._cleanupAutoUpdate = null;
	}

	/** Compute and apply the floating element's position once. */
	public position(triggerEl: HTMLElement, floatingEl: HTMLElement): void {
		const config = this._getConfig();

		if (config.matchTriggerWidth) {
			floatingEl.style.width = `${triggerEl.offsetWidth}px`;
		}

		const middleware = [offset(config.offset), flip(), shift({ padding: config.shiftPadding ?? 8 })];

		const arrowEl = config.arrowElement ?? null;
		if (arrowEl) {
			middleware.push(arrowMiddleware({ element: arrowEl, padding: config.arrowPadding ?? 8 }));
		}

		const { x, y, placement, middlewareData } = computePosition(triggerEl, floatingEl, {
			placement: config.placement,
			middleware
		});

		floatingEl.style.left = `${x}px`;
		floatingEl.style.top = `${y}px`;

		if (config.placementAttribute) {
			floatingEl.dataset.placement = placement;
		}

		if (arrowEl && middlewareData.arrow) {
			positionOverlayArrow(arrowEl, placement, middlewareData.arrow as { x?: number; y?: number });
		}
	}
}

/**
 * Apply arrow middleware coordinates to the arrow element and pin it to the
 * side of the floating element facing the trigger.
 */
export function positionOverlayArrow(arrowEl: HTMLElement, placement: string, arrowData: { x?: number; y?: number }): void {
	const side = placement.split('-')[0];

	arrowEl.style.left = arrowData.x === undefined ? '' : `${arrowData.x}px`;
	arrowEl.style.right = '';
	arrowEl.style.top = arrowData.y === undefined ? '' : `${arrowData.y}px`;
	arrowEl.style.bottom = '';

	if (side === 'top') {
		arrowEl.style.bottom = '-4px';
	}
	if (side === 'bottom') {
		arrowEl.style.top = '-4px';
	}
	if (side === 'left') {
		arrowEl.style.right = '-4px';
	}
	if (side === 'right') {
		arrowEl.style.left = '-4px';
	}
}
