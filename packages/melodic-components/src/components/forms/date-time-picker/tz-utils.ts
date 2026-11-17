/**
 * Timezone helpers for ml-date-time-picker.
 *
 * These functions translate between a naive wall-clock string
 * (`YYYY-MM-DDTHH:mm[:ss]`) and a real UTC instant, anchored to an IANA
 * timezone name (e.g. `America/Detroit`). All conversions are done via
 * `Intl.DateTimeFormat` offset reflection — there are no hardcoded zone
 * tables.
 *
 * DST policy:
 *  - Spring-forward gap (e.g. 2026-03-08 02:30 in America/Detroit doesn't
 *    exist) resolves to the post-jump wall clock, i.e. the input is
 *    interpreted one hour forward (03:30 EDT in this example).
 *  - Fall-back ambiguity (e.g. 2026-11-01 01:30 happens twice) resolves
 *    to the FIRST occurrence (still-DST / EDT). This matches RFC 5545
 *    VTIMEZONE behavior and the default in major calendar apps.
 */

export type TimezoneLabelFormat = 'short' | 'long' | 'offset' | 'none';

const NAIVE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const UTC_RE = /(?:Z|[+-]\d{2}:?\d{2})$/;

export function isUtcIsoString(value: string): boolean {
	return !!value && UTC_RE.test(value);
}

export function isNaiveDateTime(value: string): boolean {
	return !!value && NAIVE_RE.test(value);
}

interface ZonedParts {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
	const fmt = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	});
	const parts: Record<string, string> = {};
	for (const p of fmt.formatToParts(date)) {
		if (p.type !== 'literal') parts[p.type] = p.value;
	}
	return {
		year: Number(parts.year),
		month: Number(parts.month),
		day: Number(parts.day),
		hour: Number(parts.hour) === 24 ? 0 : Number(parts.hour),
		minute: Number(parts.minute),
		second: Number(parts.second)
	};
}

/** Offset of `timeZone` relative to UTC at `date`, in milliseconds (positive = ahead of UTC). */
export function getZoneOffsetMs(date: Date, timeZone: string): number {
	const p = getZonedParts(date, timeZone);
	const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
	return asUtc - date.getTime();
}

/**
 * Convert a naive wall-clock string to a real UTC instant, treating the
 * naive value as a wall clock in `timeZone`.
 *
 * Returns the UTC ISO 8601 string with `Z` suffix.
 */
export function naiveToUtcIso(naive: string, timeZone: string): string {
	if (!naive) return '';
	const padded = naive.length === 16 ? `${naive}:00` : naive;
	const naiveAsUtc = new Date(`${padded}Z`);
	if (Number.isNaN(naiveAsUtc.getTime())) return '';

	// The zone's offset has to be the one in force at the REAL instant, which
	// is what we are solving for. Reading it at `naiveAsUtc` (the wall clock
	// misread as UTC) is off by the zone's own offset, so for several hours
	// around every DST transition it picked the wrong side of the change and
	// the result was an hour out.
	//
	// Probe a day either side — far enough to bracket any transition near the
	// wall clock — to get the offset before and after, then keep the
	// candidate(s) that actually round-trip to the requested wall clock.
	const naiveMs = naiveAsUtc.getTime();
	const before = getZoneOffsetMs(new Date(naiveMs - DAY_MS), timeZone);
	const after = getZoneOffsetMs(new Date(naiveMs + DAY_MS), timeZone);

	const candidates = (before === after ? [before] : [before, after])
		.map((offset) => ({ offset, instant: naiveMs - offset }))
		.filter(({ offset, instant }) => getZoneOffsetMs(new Date(instant), timeZone) === offset)
		.map(({ instant }) => instant);

	if (candidates.length > 0) {
		// Two matches = fall-back ambiguity: the first occurrence wins.
		return new Date(Math.min(...candidates)).toISOString();
	}

	// No match = spring-forward gap (the wall clock does not exist). Applying
	// the pre-transition offset lands on the post-jump wall clock.
	return new Date(naiveMs - before).toISOString();
}

/**
 * Convert a UTC instant (Date or ISO string) to a naive wall-clock string
 * in `timeZone`. Output format: `YYYY-MM-DDTHH:mm`.
 */
export function utcToNaive(instant: Date | string, timeZone: string): string {
	const date = typeof instant === 'string' ? new Date(instant) : instant;
	if (Number.isNaN(date.getTime())) return '';
	const p = getZonedParts(date, timeZone);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/**
 * Format a timezone name/abbreviation/offset for display next to the input.
 *
 * - `short`  → `EDT`
 * - `long`   → `Eastern Daylight Time`
 * - `offset` → `GMT-4`
 * - `none`   → `''`
 */
export function formatTimezoneLabel(
	instant: Date,
	timeZone: string,
	format: TimezoneLabelFormat
): string {
	if (format === 'none' || !timeZone) return '';
	const timeZoneName: Intl.DateTimeFormatOptions['timeZoneName'] =
		format === 'long' ? 'long' : format === 'offset' ? 'shortOffset' : 'short';
	try {
		const fmt = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName });
		const part = fmt.formatToParts(instant).find((p) => p.type === 'timeZoneName');
		return part?.value ?? '';
	} catch {
		return '';
	}
}

/** Resolves the browser's local IANA timezone, falling back to UTC. */
export function getLocalTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
}

/**
 * True iff `timeZone` produces a different UTC offset from the viewer's
 * local zone at the given instant. Compares offsets, not zone names —
 * `America/Detroit` and `America/New_York` won't trigger this because
 * they share an offset year-round.
 */
export function viewerOffsetDiffersAt(instant: Date, timeZone: string): boolean {
	const local = getLocalTimeZone();
	if (!timeZone || local === timeZone) return false;
	return getZoneOffsetMs(instant, local) !== getZoneOffsetMs(instant, timeZone);
}

/**
 * Render the viewer's local wall-clock + tz label for the given UTC instant.
 * Used by the optional `viewer-hint` line.
 */
export function formatViewerHint(instant: Date, format: TimezoneLabelFormat = 'short'): {
	wallClock: string;
	label: string;
} {
	const local = getLocalTimeZone();
	const naive = utcToNaive(instant, local);
	const [, time] = naive.split('T');
	const [hStr, mStr] = (time ?? '').split(':');
	const h24 = Number(hStr);
	const period = h24 >= 12 ? 'PM' : 'AM';
	let h12 = h24 % 12;
	if (h12 === 0) h12 = 12;
	const wallClock = `${h12}:${mStr} ${period}`;
	const label = formatTimezoneLabel(instant, local, format);
	return { wallClock, label };
}
