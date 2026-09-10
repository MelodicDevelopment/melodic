/**
 * Scheduler for the signal graph.
 *
 * Writes are two-phase:
 *   1. Invalidation (synchronous, always): the written signal marks every
 *      transitive dependent — computeds become dirty, effects are queued.
 *      Nothing user-visible runs during this phase.
 *   2. Execution (deferred while a batch is open, otherwise immediate):
 *      queued raw subscribers are notified, then queued effects run —
 *      de-duplicated by identity — until both queues drain.
 *
 * Because invalidation finishes before any consumer executes, a consumer
 * that reads several derived values always sees them in a consistent state
 * (no "glitches"), and a computed read inside a batch reflects writes made
 * earlier in that batch.
 */

interface Runnable {
	runNow(): void;
}

/**
 * Maximum number of times a single effect may run within one flush. Exceeding
 * it means an effect keeps writing a signal it also depends on.
 */
const MAX_FLUSH_RUNS = 100;

let batchDepth = 0;
let flushing = false;
const pendingNotifications = new Set<() => void>();
const pendingEffects = new Set<Runnable>();
const flushRuns = new Map<Runnable, number>();

/** True while a batch is open. */
export function isBatching(): boolean {
	return batchDepth > 0;
}

/**
 * True while a batch is open OR its flush is in progress. Effects consult this
 * so that effect runs triggered during the flush are coalesced rather than
 * executed once per dependency.
 */
export function isCoalescingEffects(): boolean {
	return batchDepth > 0 || flushing;
}

/** Queue a signal's notify callback; de-duplicated by callback identity. */
export function scheduleNotify(notify: () => void): void {
	pendingNotifications.add(notify);
}

/** Queue an effect run; de-duplicated by effect identity. */
export function scheduleEffect(effect: Runnable): void {
	pendingEffects.add(effect);
}

/** Drop a queued effect run (the effect was destroyed before it could run). */
export function unscheduleEffect(effect: Runnable): void {
	pendingEffects.delete(effect);
}

/**
 * Execute queued work now — unless a batch is open (it flushes when the
 * outermost batch closes) or a flush is already draining (it picks the new
 * work up in its loop).
 */
export function flush(): void {
	if (batchDepth > 0 || flushing) {
		return;
	}
	flushBatch();
}

function circularError(): Error {
	return new Error(
		`Circular dependency detected in effect: exceeded ${MAX_FLUSH_RUNS} synchronous re-runs. ` +
			'An effect is repeatedly writing to a signal it also reads.'
	);
}

function rethrow(errors: unknown[]): void {
	if (errors.length === 1) {
		throw errors[0];
	}
	if (errors.length > 1) {
		throw new AggregateError(errors, `${errors.length} signal subscribers threw during flush`);
	}
}

/**
 * Drain both queues. Every callback runs even if an earlier one throws;
 * failures are collected and rethrown once the queues are empty (a single
 * error as-is, several as an AggregateError), so one bad subscriber cannot
 * silently drop unrelated updates.
 */
function flushBatch(): void {
	flushing = true;
	const errors: unknown[] = [];

	try {
		while (pendingNotifications.size > 0 || pendingEffects.size > 0) {
			if (pendingNotifications.size > 0) {
				const notifications = [...pendingNotifications];
				pendingNotifications.clear();
				for (const notify of notifications) {
					try {
						notify();
					} catch (error) {
						errors.push(error);
					}
				}
			}

			if (pendingEffects.size > 0) {
				const effects = [...pendingEffects];
				pendingEffects.clear();
				for (const effect of effects) {
					const runs = (flushRuns.get(effect) ?? 0) + 1;
					if (runs > MAX_FLUSH_RUNS) {
						// Abandon the flush: leaving the queues populated would
						// re-trigger the loop on the next write.
						pendingNotifications.clear();
						pendingEffects.clear();
						throw errors.length > 0 ? new AggregateError([circularError(), ...errors], 'Circular dependency detected in effect') : circularError();
					}
					flushRuns.set(effect, runs);

					try {
						effect.runNow();
					} catch (error) {
						errors.push(error);
					}
				}
			}
		}
	} finally {
		flushing = false;
		flushRuns.clear();
	}

	rethrow(errors);
}

/**
 * Run `fn`, deferring all signal notifications and effect runs until it
 * returns. Nested batches are supported — work flushes only when the
 * outermost batch completes. Writes made inside the batch are visible to
 * reads (including computed reads) made later in the same batch.
 */
export function batch<T>(fn: () => T): T {
	batchDepth++;
	try {
		return fn();
	} finally {
		batchDepth--;
		if (batchDepth === 0) {
			flushBatch();
		}
	}
}
