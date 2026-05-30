/**
 * Batching primitive for signals.
 *
 * While a batch is active, signal notifications are deferred and de-duplicated
 * until the outermost batch completes. The flush runs in two interleaved
 * phases until both queues drain:
 *   1. signal notifications (raw subscribers + scheduling of dependent effects)
 *   2. dependent effect runs, de-duplicated by effect identity
 *
 * This makes batches glitch-free: a computed/effect depending on several
 * signals written in the same batch recomputes once, not once per source.
 */

interface Runnable {
	runNow(): void;
}

let batchDepth = 0;
let flushing = false;
const pendingNotifications = new Set<() => void>();
const pendingEffects = new Set<Runnable>();

/**
 * True while a batch is open. Signals consult this to decide whether to defer
 * notification. It is intentionally false during the flush itself, so queued
 * notifications actually execute when drained.
 */
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

function flushBatch(): void {
	flushing = true;
	try {
		while (pendingNotifications.size > 0 || pendingEffects.size > 0) {
			if (pendingNotifications.size > 0) {
				const notifications = [...pendingNotifications];
				pendingNotifications.clear();
				for (const notify of notifications) {
					notify();
				}
			}

			if (pendingEffects.size > 0) {
				const effects = [...pendingEffects];
				pendingEffects.clear();
				for (const effect of effects) {
					effect.runNow();
				}
			}
		}
	} finally {
		flushing = false;
	}
}

/**
 * Run `fn`, deferring all signal notifications until it returns. Nested batches
 * are supported — notifications flush only when the outermost batch completes.
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
