import { SignalEffect } from '../classes/signal-effect.class';
import { getActiveEffect, setActiveEffect } from './active-effect.functions';
import { scheduleEffect, unscheduleEffect } from './batch.function';
import { notifyAll } from './signal.function';
import { DEPENDENTS, SIGNAL_MARKER, type IDependent } from '../types/signal.type';
import type { Subscriber } from '../types/subscriber.type';
import type { Unsubscriber } from '../types/unsubscriber.type';
import { getActiveComponent } from '../../components/functions/active-component.functions';
import { devWarn } from '../../devtools/dev-mode';
import { emitDevtools } from '../../devtools/hook';

const destroyedMessage = (name: string | undefined): string =>
	`Computed signal${name ? ` '${name}'` : ''} accessed after destruction. ` +
	'Holding a signal beyond its owning component (e.g. cached on a long-lived service) is a bug — ' +
	'the signal is destroyed when its component disconnects.';

const READ_ONLY_MESSAGE =
	'Cannot write to a computed signal — its value is derived from its sources. Update the source signal(s) instead.';

/**
 * A derived signal that can be read, subscribed to, and destroyed — but not
 * written. `computed()` returns this type; `set()`/`update()` remain present
 * only for structural compatibility with `Signal<T>` and throw at runtime.
 */
export type ReadonlySignal<T> = {
	(): T;
	/** @deprecated Computed signals are read-only — calling `set()` throws at runtime. */
	set(value: never): void;
	/** @deprecated Computed signals are read-only — calling `update()` throws at runtime. */
	update(updater: never): void;
	subscribe(subscriber: Subscriber<T>): Unsubscriber;
	unsubscribe(subscriber: Subscriber<T>): void;
	destroy(): void;
};

export interface IComputedOptions {
	/** Label used in error messages and DevTools. */
	name?: string;
}

/**
 * Creates a lazily-evaluated derived signal.
 *
 * The computation does NOT run at creation time, nor when a source changes —
 * it runs on the next read after a source changed (dirty-flag semantics).
 * When a source changes the computed is marked dirty synchronously and the
 * invalidation is propagated to its dependents (effects, other computeds)
 * before any of them execute, so a consumer reading several computeds always
 * sees a consistent set of values, and a read made inside a `batch()` after a
 * write reflects that write.
 *
 * Note: because invalidation is propagated without recomputing, dependents are
 * woken even if the recomputed value turns out to be equal to the previous
 * one. Direct `subscribe()` callbacks, in contrast, are equality-gated: they
 * only fire when the recomputed value actually changed (`Object.is`).
 */
export function computed<T>(computation: () => T, options: IComputedOptions = {}): ReadonlySignal<T> {
	let value: T;
	let dirty = true;
	let destroyed = false;
	const subscribers = new Set<Subscriber<T>>();
	const dependents = new Set<IDependent>();

	/** Re-evaluate the computation, tracking its source reads on `tracker`. */
	const recompute = (): void => {
		// Drop stale source subscriptions before re-tracking.
		tracker.clearDependencies();

		const prevEffect = getActiveEffect();
		setActiveEffect(tracker);
		try {
			value = computation();
			dirty = false;
			emitDevtools('computed:recompute', () => ({ name: options.name, value }));
		} finally {
			setActiveEffect(prevEffect);
		}
	};

	// `tracker` reads the sources on our behalf. It is never executed by the
	// scheduler: a source change goes through `onInvalidate` (mark dirty,
	// propagate) and nothing else. Keeping the tracker out of the run queue
	// matters — `SignalEffect.runNow()` clears dependencies before executing,
	// so scheduling it would drop every source subscription whenever the
	// computed had already been brought up to date by a read.
	const tracker = new SignalEffect(() => {}, {
		onInvalidate: () => {
			// Already dirty ⇒ dependents were invalidated when we became dirty
			// and nobody has read us since, so there is nothing new to propagate.
			if (destroyed || dirty) {
				return;
			}

			dirty = true;

			for (const dependent of [...dependents]) {
				dependent.invalidate();
			}

			if (subscribers.size > 0) {
				scheduleEffect(notifier);
			}
		}
	});

	// The value most recently pushed to direct subscribers. Compared against
	// the current value at notification time (not against a snapshot taken
	// when the notifier runs) so a recompute triggered by a read between
	// invalidation and flush still produces exactly one notification.
	let lastNotified: T;

	// Pushes a fresh value to direct subscribers. Separate from `tracker` so
	// running it never disturbs source tracking; `recompute()` is the only
	// place dependencies are reset.
	const notifier = {
		runNow: (): void => {
			if (destroyed) {
				return;
			}
			if (dirty) {
				recompute();
			}
			if (!Object.is(lastNotified, value)) {
				lastNotified = value;
				notifyAll([...subscribers], value);
			}
		}
	};

	const read = (() => {
		if (destroyed) {
			throw new Error(destroyedMessage(options.name));
		}

		// Register the active effect (if any) as a dependent before computing,
		// so it is woken on future invalidations.
		const activeEffect = getActiveEffect();
		if (activeEffect) {
			activeEffect.addDependency(read);
			dependents.add(activeEffect);
		}

		if (dirty) {
			recompute();
		}

		return value;
	}) as ReadonlySignal<T> & { [DEPENDENTS]: Set<IDependent> };

	read.set = () => {
		throw new Error(READ_ONLY_MESSAGE);
	};

	read.update = () => {
		throw new Error(READ_ONLY_MESSAGE);
	};

	read.subscribe = (subscriber: Subscriber<T>): Unsubscriber => {
		if (destroyed) {
			throw new Error(destroyedMessage(options.name));
		}

		// Ensure source tracking is established (a never-read computed has no
		// source subscriptions yet, so invalidations would never fire).
		if (dirty) {
			recompute();
		}

		// The first subscriber establishes the notification baseline. Later
		// subscribers must not move it: an earlier subscriber may still be
		// owed a queued notification for the current value.
		if (subscribers.size === 0) {
			lastNotified = value;
		}

		subscribers.add(subscriber);
		return () => subscribers.delete(subscriber);
	};

	read.unsubscribe = (subscriber: Subscriber<T>): void => {
		subscribers.delete(subscriber);
	};

	read.destroy = (): void => {
		if (destroyed) {
			return;
		}
		destroyed = true;
		tracker.destroy();
		unscheduleEffect(notifier);
		dependents.clear();
		subscribers.clear();
	};

	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});

	Object.defineProperty(read, DEPENDENTS, {
		value: dependents,
		enumerable: false,
		configurable: false
	});

	// Auto-register with the component being constructed (if any) so the
	// computed's source subscriptions are torn down when that component is
	// destroyed. Mirrors form/select registration. Outside a component scope,
	// the caller owns the lifetime.
	const owner = getActiveComponent();
	owner?.registerDisposable(read);

	// A computed created DURING a render is created again on every render and
	// each copy lives until the component unmounts — 20 updates left 21 live
	// computeds. `select()` sweeps its render-scoped entries; computed() cannot,
	// because it has no cache key to recognise the same computed by.
	if (owner?.isRendering) {
		devWarn(
			`computed-in-render:${owner.selector ?? 'component'}${options.name ? `:${options.name}` : ''}`,
			`computed()${options.name ? ` '${options.name}'` : ''} was created while <${owner.selector ?? 'a component'}> was rendering. ` +
				'A new one is created on every render and they accumulate for the life of the component. ' +
				'Create it in a field initializer or onInit, or use store.select(key, fn, cacheKey), which is render-scoped.'
		);
	}

	return read;
}
