import { describe, it, expect } from 'vitest';
import {
	parseEventDate,
	toLocalIsoDate,
	getEventsForDate,
	getMiniCalendarDots,
	layoutOverlappingEvents,
	formatTime,
	TOTAL_ROWS
} from '../../../src/components/data-display/calendar-view/calendar-view.utils';
import type { CalendarEvent } from '../../../src/components/data-display/calendar-view/calendar-view.types';

function ev(id: string, start: string, end: string): CalendarEvent {
	return { id, title: id, start, end };
}

describe('calendar-view timezone basis', () => {
	it('parses date-only strings as LOCAL midnight, not UTC midnight', () => {
		const d = parseEventDate('2026-07-06');
		expect(d.getFullYear()).toBe(2026);
		expect(d.getMonth()).toBe(6);
		expect(d.getDate()).toBe(6);
		expect(d.getHours()).toBe(0);
	});

	it('buckets an event on the same local date its time is rendered for (UTC timestamp)', () => {
		// Pick a UTC instant near midnight so bucketing by raw ISO substring and
		// by local date disagree in most non-UTC timezones.
		const start = '2026-07-06T23:30:00Z';
		const event = ev('a', start, '2026-07-06T23:45:00Z');
		const localDate = toLocalIsoDate(new Date(start));

		// The event appears exactly under its LOCAL date…
		expect(getEventsForDate([event], localDate)).toHaveLength(1);
		// …and its rendered time matches that same local basis.
		const local = new Date(start);
		const renderedHour = local.getHours() % 12 || 12;
		expect(formatTime(start)).toContain(String(renderedHour));

		// If the local date differs from the raw ISO substring, the old (substring)
		// bucket must be empty — the day/time pairing is consistent either way.
		const rawDate = start.split('T')[0];
		if (rawDate !== localDate) {
			expect(getEventsForDate([event], rawDate)).toHaveLength(0);
		}
	});

	it('mini calendar dots use the same local basis as day bucketing', () => {
		const start = '2026-07-06T23:30:00Z';
		const event = ev('a', start, '2026-07-06T23:45:00Z');
		const local = new Date(start);
		const dots = getMiniCalendarDots(local.getFullYear(), local.getMonth(), [event]);
		expect(dots.has(toLocalIsoDate(local))).toBe(true);
	});
});

describe('calendar-view layoutOverlappingEvents', () => {
	it('clamps midnight-crossing events to the end of the day (gridRowEnd >= gridRowStart)', () => {
		const [positioned] = layoutOverlappingEvents([
			ev('night', '2026-07-06T23:00:00', '2026-07-07T01:00:00')
		]);

		expect(positioned.gridRowStart).toBe(47); // 23:00 → row 47 of 48
		expect(positioned.gridRowEnd).toBe(TOTAL_ROWS + 1); // clamped to end of day
		expect(positioned.gridRowEnd).toBeGreaterThan(positioned.gridRowStart);
	});

	it('gives zero/negative-duration events a minimum positive span', () => {
		const [positioned] = layoutOverlappingEvents([
			ev('degenerate', '2026-07-06T10:00:00', '2026-07-06T10:00:00')
		]);
		expect(positioned.gridRowEnd).toBeGreaterThan(positioned.gridRowStart);
	});

	it('tiles two overlapping events side by side at half width', () => {
		const result = layoutOverlappingEvents([
			ev('a', '2026-07-06T09:00:00', '2026-07-06T10:00:00'),
			ev('b', '2026-07-06T09:30:00', '2026-07-06T10:30:00')
		]);
		expect(result).toHaveLength(2);
		for (const p of result) {
			expect(p.width).toBeCloseTo(0.5);
		}
		const lefts = result.map((p) => p.left).sort();
		expect(lefts[0]).toBeCloseTo(0);
		expect(lefts[1]).toBeCloseTo(0.5);
	});

	it('gives non-overlapping events full width even when a midnight-crosser is present', () => {
		const result = layoutOverlappingEvents([
			ev('night', '2026-07-06T23:00:00', '2026-07-07T01:00:00'),
			ev('morning', '2026-07-06T09:00:00', '2026-07-06T10:00:00')
		]);
		const morning = result.find((p) => p.event.id === 'morning')!;
		// Before the clamp, the crosser's end (60 min) was numerically before the
		// morning event's start, corrupting column packing.
		expect(morning.width).toBeCloseTo(1);
	});
});
