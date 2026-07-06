import { describe, it, expect, vi, afterEach } from 'vitest';
import { OverlayPositioner, positionOverlayArrow, ToggleDismissGuard } from '../../src/utils/overlay/index';

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

afterEach(() => {
	document.body.innerHTML = '';
	vi.useRealTimers();
});

describe('OverlayPositioner', () => {
	it('positions immediately on start() and tracks window scroll until stop()', () => {
		const trigger = makeElement({ x: 100, y: 100, width: 80, height: 30 });
		const floating = makeElement({ x: 0, y: 0, width: 120, height: 60 });

		const positioner = new OverlayPositioner(() => ({ placement: 'bottom-start', offset: 4 }));
		expect(positioner.active).toBe(false);

		positioner.start(trigger, floating);
		expect(positioner.active).toBe(true);
		// Initial position applied synchronously (autoUpdate initial run).
		expect(floating.style.left).toBe('100px');
		expect(floating.style.top).toBe(`${100 + 30 + 4}px`);

		// Repositions while open.
		floating.style.left = '';
		window.dispatchEvent(new Event('scroll'));
		expect(floating.style.left).toBe('100px');

		// stop() tears the subscription down.
		positioner.stop();
		expect(positioner.active).toBe(false);
		floating.style.left = '';
		window.dispatchEvent(new Event('scroll'));
		expect(floating.style.left).toBe('');
	});

	it('reads config fresh on every update (reactive placement/offset)', () => {
		const trigger = makeElement({ x: 100, y: 100, width: 80, height: 30 });
		const floating = makeElement({ x: 0, y: 0, width: 120, height: 60 });

		let offsetValue = 4;
		const positioner = new OverlayPositioner(() => ({ placement: 'bottom-start', offset: offsetValue }));

		positioner.start(trigger, floating);
		expect(floating.style.top).toBe(`${130 + 4}px`);

		offsetValue = 12;
		window.dispatchEvent(new Event('scroll'));
		expect(floating.style.top).toBe(`${130 + 12}px`);

		positioner.stop();
	});

	it('matches the trigger width when matchTriggerWidth is set', () => {
		const trigger = makeElement({ x: 100, y: 100, width: 80, height: 30 });
		Object.defineProperty(trigger, 'offsetWidth', { get: () => 80 });
		const floating = makeElement({ x: 0, y: 0, width: 120, height: 60 });

		const positioner = new OverlayPositioner(() => ({ placement: 'bottom-start', offset: 4, matchTriggerWidth: true }));
		positioner.start(trigger, floating);

		expect(floating.style.width).toBe('80px');
		positioner.stop();
	});

	it('reflects the resolved placement as data-placement only when configured', () => {
		const trigger = makeElement({ x: 100, y: 100, width: 80, height: 30 });
		const floating = makeElement({ x: 0, y: 0, width: 120, height: 60 });

		const plain = new OverlayPositioner(() => ({ placement: 'bottom-start', offset: 4 }));
		plain.position(trigger, floating);
		expect(floating.dataset.placement).toBeUndefined();

		const reflecting = new OverlayPositioner(() => ({ placement: 'bottom-start', offset: 4, placementAttribute: true }));
		reflecting.position(trigger, floating);
		expect(floating.dataset.placement).toBe('bottom-start');
	});

	it('positions a configured arrow element via the arrow middleware', () => {
		const trigger = makeElement({ x: 200, y: 100, width: 40, height: 20 });
		const floating = makeElement({ x: 0, y: 0, width: 100, height: 50 });
		const arrowEl = makeElement({ x: 0, y: 0, width: 8, height: 8 });

		const positioner = new OverlayPositioner(() => ({
			placement: 'bottom',
			offset: 8,
			arrowElement: arrowEl,
			placementAttribute: true
		}));
		positioner.position(trigger, floating);

		// Bottom placement: arrow pinned to the floating element's top edge and
		// horizontally aligned with the trigger center.
		expect(arrowEl.style.top).toBe('-4px');
		expect(arrowEl.style.left).not.toBe('');
	});

	it('restarts cleanly when start() is called while active, and stop() is idempotent', () => {
		const trigger = makeElement({ x: 100, y: 100, width: 80, height: 30 });
		const floating = makeElement({ x: 0, y: 0, width: 120, height: 60 });
		const positioner = new OverlayPositioner(() => ({ placement: 'bottom-start', offset: 4 }));

		positioner.start(trigger, floating);
		positioner.start(trigger, floating);
		expect(positioner.active).toBe(true);

		positioner.stop();
		positioner.stop();
		expect(positioner.active).toBe(false);

		// No stray subscriptions left behind after the restart + stop.
		floating.style.left = '';
		window.dispatchEvent(new Event('scroll'));
		expect(floating.style.left).toBe('');
	});
});

describe('positionOverlayArrow', () => {
	it.each([
		['top', 'bottom'],
		['bottom', 'top'],
		['left', 'right'],
		['right', 'left']
	])('pins the arrow to the %s-facing edge via %s: -4px', (placement, pinnedSide) => {
		const arrowEl = document.createElement('div');
		positionOverlayArrow(arrowEl, placement, { x: 10 });
		expect(arrowEl.style.getPropertyValue(pinnedSide)).toBe('-4px');
	});

	it('applies arrow coordinates and clears the axes it does not use', () => {
		const arrowEl = document.createElement('div');
		positionOverlayArrow(arrowEl, 'bottom-start', { x: 24 });

		expect(arrowEl.style.left).toBe('24px');
		expect(arrowEl.style.top).toBe('-4px'); // pinned side for bottom placement
		expect(arrowEl.style.right).toBe('');
		expect(arrowEl.style.bottom).toBe('');
	});
});

describe('ToggleDismissGuard', () => {
	it('swallows exactly one toggle after a dismissal', () => {
		const guard = new ToggleDismissGuard();

		expect(guard.shouldSkipToggle()).toBe(false);

		guard.dismissed();
		expect(guard.shouldSkipToggle()).toBe(true); // the dismissing click
		expect(guard.shouldSkipToggle()).toBe(false); // consumed
	});

	it('self-clears on the next macrotask when no toggle arrives', async () => {
		vi.useFakeTimers();
		const guard = new ToggleDismissGuard();

		guard.dismissed();
		await vi.advanceTimersByTimeAsync(0);

		expect(guard.shouldSkipToggle()).toBe(false);
	});
});
