import { describe, it, expect, afterEach } from 'vitest';
import '../../../src/components/forms/date-time-picker/date-time-picker.component';
import {
	naiveToUtcIso,
	utcToNaive,
	isUtcIsoString,
	formatTimezoneLabel,
	getZoneOffsetMs
} from '../../../src/components/forms/date-time-picker/tz-utils';
import {
	flush,
	createComponent,
	removeComponent,
	shadowQuery,
	captureEvent
} from '../../helpers/component-test-utils';

// --- Pure tz-utils ---------------------------------------------------------

describe('tz-utils', () => {
	describe('naiveToUtcIso', () => {
		it('shifts wall-clock to UTC for America/Detroit (EDT, -4)', () => {
			expect(naiveToUtcIso('2026-04-27T09:00:00', 'America/Detroit'))
				.toBe('2026-04-27T13:00:00.000Z');
		});

		it('shifts wall-clock to UTC for Asia/Karachi (+5)', () => {
			expect(naiveToUtcIso('2026-04-27T09:00:00', 'Asia/Karachi'))
				.toBe('2026-04-27T04:00:00.000Z');
		});

		it('passes through wall-clock for UTC zone', () => {
			expect(naiveToUtcIso('2026-04-27T09:00:00', 'UTC'))
				.toBe('2026-04-27T09:00:00.000Z');
		});

		it('shifts wall-clock to UTC for America/Detroit in winter (EST, -5)', () => {
			expect(naiveToUtcIso('2026-12-15T09:00:00', 'America/Detroit'))
				.toBe('2026-12-15T14:00:00.000Z');
		});

		it('accepts HH:mm without seconds', () => {
			expect(naiveToUtcIso('2026-04-27T09:00', 'America/Detroit'))
				.toBe('2026-04-27T13:00:00.000Z');
		});
	});

	describe('utcToNaive', () => {
		it('converts UTC instant to wall-clock in target zone', () => {
			expect(utcToNaive('2026-04-27T13:00:00Z', 'America/Detroit'))
				.toBe('2026-04-27T09:00');
		});

		it('round-trips through naiveToUtcIso', () => {
			const naive = '2026-04-27T09:00:00';
			const utc = naiveToUtcIso(naive, 'America/Detroit');
			expect(utcToNaive(utc, 'America/Detroit')).toBe('2026-04-27T09:00');
		});
	});

	describe('isUtcIsoString', () => {
		it('detects Z-suffixed strings', () => {
			expect(isUtcIsoString('2026-04-27T13:00:00Z')).toBe(true);
			expect(isUtcIsoString('2026-04-27T13:00:00.000Z')).toBe(true);
		});

		it('detects +/-HH:MM offset suffixes', () => {
			expect(isUtcIsoString('2026-04-27T13:00:00+05:00')).toBe(true);
			expect(isUtcIsoString('2026-04-27T13:00:00-04:00')).toBe(true);
		});

		it('rejects naive strings', () => {
			expect(isUtcIsoString('2026-04-27T13:00:00')).toBe(false);
			expect(isUtcIsoString('2026-04-27T13:00')).toBe(false);
		});
	});

	describe('DST policy', () => {
		// 2026-03-08 02:30 doesn't exist in America/Detroit (clocks 02:00 → 03:00).
		// Policy: shift forward by one hour, so the input is interpreted as 03:30 EDT.
		// 03:30 EDT (UTC-4) == 07:30 UTC.
		it('spring-forward gap shifts forward into DST', () => {
			expect(naiveToUtcIso('2026-03-08T02:30:00', 'America/Detroit'))
				.toBe('2026-03-08T07:30:00.000Z');
		});

		// 2026-11-01 01:30 happens twice in America/Detroit (01:30 EDT, then 01:30 EST).
		// Policy: interpret as the FIRST occurrence (still-DST / EDT).
		// 01:30 EDT (UTC-4) == 05:30 UTC.
		it('fall-back ambiguity resolves to the first occurrence (still-DST)', () => {
			expect(naiveToUtcIso('2026-11-01T01:30:00', 'America/Detroit'))
				.toBe('2026-11-01T05:30:00.000Z');
		});
	});

	describe('getZoneOffsetMs', () => {
		it('returns 0 for UTC', () => {
			expect(getZoneOffsetMs(new Date('2026-04-27T12:00:00Z'), 'UTC')).toBe(0);
		});

		it('returns -4h for Detroit in summer (EDT)', () => {
			const ms = getZoneOffsetMs(new Date('2026-07-15T12:00:00Z'), 'America/Detroit');
			expect(ms).toBe(-4 * 60 * 60 * 1000);
		});

		it('returns -5h for Detroit in winter (EST)', () => {
			const ms = getZoneOffsetMs(new Date('2026-12-15T12:00:00Z'), 'America/Detroit');
			expect(ms).toBe(-5 * 60 * 60 * 1000);
		});
	});

	describe('formatTimezoneLabel', () => {
		const summer = new Date('2026-07-15T12:00:00Z');

		it('returns short abbreviation', () => {
			expect(formatTimezoneLabel(summer, 'America/Detroit', 'short')).toBe('EDT');
		});

		it('returns long zone name', () => {
			expect(formatTimezoneLabel(summer, 'America/Detroit', 'long'))
				.toMatch(/Eastern Daylight Time/);
		});

		it('returns offset-style label', () => {
			expect(formatTimezoneLabel(summer, 'America/Detroit', 'offset'))
				.toMatch(/^GMT[+-]\d/);
		});

		it('returns empty for "none"', () => {
			expect(formatTimezoneLabel(summer, 'America/Detroit', 'none')).toBe('');
		});
	});
});

// --- Component integration -------------------------------------------------

interface DateTimePickerEl extends HTMLElement {
	value: string;
	timezone: string;
	timezoneLabel: string;
	viewerHint: boolean;
	dateValue: string;
	timeValue: string;
}

/** Trigger a synthetic ml:change on a sub-picker so we don't depend on its UI. */
function emitFromChild(host: HTMLElement, childTag: string, value: string): void {
	const child = shadowQuery(host, childTag);
	if (!child) throw new Error(`child ${childTag} not found`);
	child.dispatchEvent(new CustomEvent('ml:change', { detail: { value }, bubbles: true }));
}

describe('ml-date-time-picker', () => {
	let el: DateTimePickerEl;

	afterEach(() => {
		if (el) removeComponent(el);
	});

	// REGRESSION: zero-config behavior must be unchanged.
	it('emits identical event shape as before when no timezone is set', async () => {
		el = createComponent<DateTimePickerEl>('ml-date-time-picker');
		await flush();

		const eventPromise = captureEvent(el, 'ml:change');
		emitFromChild(el, 'ml-date-picker', '2026-02-08');
		emitFromChild(el, 'ml-time-picker', '09:30');
		const event = await eventPromise;

		expect(event.detail).toEqual({
			value: '2026-02-08',
			date: '2026-02-08',
			time: ''
		});
		// valueUtc and timezone keys must NOT be on the detail.
		expect('valueUtc' in event.detail).toBe(false);
		expect('timezone' in event.detail).toBe(false);
	});

	it('emits valueUtc and timezone in change detail when timezone is set', async () => {
		el = createComponent<DateTimePickerEl>('ml-date-time-picker', {
			properties: { timezone: 'America/Detroit' }
		});
		await flush();

		// Type a wall-clock of 09:00 on 2026-04-27 — should round-trip to 13:00Z.
		emitFromChild(el, 'ml-date-picker', '2026-04-27');
		const eventPromise = captureEvent(el, 'ml:change');
		emitFromChild(el, 'ml-time-picker', '09:00');
		const event = await eventPromise;

		expect(event.detail.value).toBe('2026-04-27T09:00');
		expect(event.detail.timezone).toBe('America/Detroit');
		expect(event.detail.valueUtc).toBe('2026-04-27T13:00:00.000Z');
	});

	it('renders a UTC ISO value as the equivalent wall-clock in the picker zone', async () => {
		el = createComponent<DateTimePickerEl>('ml-date-time-picker', {
			properties: {
				timezone: 'America/Detroit',
				value: '2026-04-27T13:00:00Z'
			}
		});
		await flush();
		await flush();

		expect(el.dateValue).toBe('2026-04-27');
		expect(el.timeValue).toBe('09:00');
	});

	it('treats a naive value as wall-clock in the picker zone (no shift)', async () => {
		el = createComponent<DateTimePickerEl>('ml-date-time-picker', {
			properties: {
				timezone: 'America/Detroit',
				value: '2026-04-27T09:00'
			}
		});
		await flush();
		await flush();

		expect(el.dateValue).toBe('2026-04-27');
		expect(el.timeValue).toBe('09:00');
	});

	it('renders a short timezone label when timezone is set', async () => {
		el = createComponent<DateTimePickerEl>('ml-date-time-picker', {
			properties: {
				timezone: 'America/Detroit',
				value: '2026-07-15T13:00:00Z'
			}
		});
		await flush();
		await flush();

		const label = shadowQuery(el, '.ml-date-time-picker__tz-label');
		expect(label).toBeTruthy();
		expect(label!.textContent).toBe('EDT');
	});

	it('does not render a timezone label when timezone is unset', async () => {
		el = createComponent<DateTimePickerEl>('ml-date-time-picker');
		await flush();
		expect(shadowQuery(el, '.ml-date-time-picker__tz-label')).toBeNull();
	});

	// --- Auto-emit on naive seed (bug-fix coverage) ---------------------

	function countEvents(target: HTMLElement, eventName: string): { count: number; last?: CustomEvent } {
		const ref = { count: 0, last: undefined as CustomEvent | undefined };
		target.addEventListener(eventName, (e) => {
			ref.count += 1;
			ref.last = e as CustomEvent;
		});
		return ref;
	}

	it('auto-emits ml:change with valueUtc when naive value + timezone are seeded together', async () => {
		el = document.createElement('ml-date-time-picker') as DateTimePickerEl;
		document.body.appendChild(el);
		const events = countEvents(el, 'ml:change');

		(el as DateTimePickerEl).value = '2026-04-30T09:00';
		(el as DateTimePickerEl).timezone = 'America/New_York';
		await flush();
		await flush();

		expect(events.count).toBe(1);
		expect(events.last!.detail.value).toBe('2026-04-30T09:00');
		expect(events.last!.detail.timezone).toBe('America/New_York');
		// 09:00 EDT (UTC-4) → 13:00 UTC
		expect(events.last!.detail.valueUtc).toBe('2026-04-30T13:00:00.000Z');
	});

	it('does not auto-emit when seeded with a UTC ISO value (no normalization needed)', async () => {
		el = document.createElement('ml-date-time-picker') as DateTimePickerEl;
		document.body.appendChild(el);
		const events = countEvents(el, 'ml:change');

		(el as DateTimePickerEl).value = '2026-04-30T13:00:00Z';
		(el as DateTimePickerEl).timezone = 'America/New_York';
		await flush();
		await flush();

		expect(events.count).toBe(0);
	});

	it('does not auto-emit when a naive value is seeded without a timezone', async () => {
		el = document.createElement('ml-date-time-picker') as DateTimePickerEl;
		document.body.appendChild(el);
		const events = countEvents(el, 'ml:change');

		(el as DateTimePickerEl).value = '2026-04-30T09:00';
		await flush();
		await flush();

		expect(events.count).toBe(0);
	});

	// REGRESSION: race when value hydrates before timezone (common in async stores)
	it('auto-emits exactly once when value is set first and timezone arrives later', async () => {
		el = document.createElement('ml-date-time-picker') as DateTimePickerEl;
		document.body.appendChild(el);
		const events = countEvents(el, 'ml:change');

		(el as DateTimePickerEl).value = '2026-04-30T09:00';
		await flush();
		expect(events.count).toBe(0);

		(el as DateTimePickerEl).timezone = 'America/New_York';
		await flush();
		await flush();

		expect(events.count).toBe(1);
		expect(events.last!.detail.valueUtc).toBe('2026-04-30T13:00:00.000Z');
	});

	it('does not re-emit when timezone is set to the value it already has', async () => {
		el = document.createElement('ml-date-time-picker') as DateTimePickerEl;
		document.body.appendChild(el);
		(el as DateTimePickerEl).value = '2026-04-30T09:00';
		(el as DateTimePickerEl).timezone = 'America/New_York';
		await flush();
		await flush();

		const events = countEvents(el, 'ml:change');
		(el as DateTimePickerEl).timezone = 'America/New_York';
		await flush();
		await flush();

		expect(events.count).toBe(0);
	});

	it('does not auto-emit when value is empty even with a timezone set', async () => {
		el = document.createElement('ml-date-time-picker') as DateTimePickerEl;
		document.body.appendChild(el);
		const events = countEvents(el, 'ml:change');

		(el as DateTimePickerEl).timezone = 'America/New_York';
		await flush();
		await flush();

		expect(events.count).toBe(0);
	});
});
