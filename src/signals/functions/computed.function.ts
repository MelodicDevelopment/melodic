import { signal } from '../functions/signal.function';
import { SignalEffect } from '../classes/signal-effect.class';
import { getActiveEffect, setActiveEffect } from './active-effect.functions';
import { SIGNAL_MARKER } from '../types/signal.type';
import type { Subscriber } from '../types/subscriber.type';
import type { Unsubscriber } from '../types/unsubscriber.type';
import { getActiveComponent } from '../../components/functions/active-component.functions';

const DESTROYED_MESSAGE =
	'Signal accessed after destruction. Holding a signal beyond its owning component (e.g. cached on a long-lived service) is a bug — the signal is destroyed when its component disconnects.';

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

/**
 * Creates a lazily-evaluated derived signal.
 *
 * The computation does NOT run at creation time, nor when a source changes —
 * it runs on the next read after a source changed (dirty-flag semantics).
 * Dependent effects (templates, `SignalEffect`s, other computeds) are still
 * notified when a source changes; their re-run reads the computed, which
 * triggers the recompute.
 *
 * Note: because invalidation is propagated without recomputing, dependents are
 * woken even if the recomputed value turns out to be equal to the previous
 * one. Direct `subscribe()` callbacks, in contrast, are equality-gated: they
 * only fire when the recomputed value actually changed (`Object.is`).
 */
export function computed<T>(computation: () => T): ReadonlySignal<T> {
	let value: T;
	let dirty = true;
	let destroyed = false;
	const subscribers = new Set<Subscriber<T>>();

	// Internal invalidation channel. Effects that read this computed are
	// registered as dependents of `version`; bumping it wakes them so they
	// re-read (and thereby recompute) the value.
	const version = signal(0);

	/** Re-evaluate the computation, tracking its source reads on `tracker`. */
	const recompute = (): void => {
		// Drop stale source subscriptions before re-tracking (mirrors
		// SignalEffect.runNow's dependency reset).
		tracker.destroy();

		const prevEffect = getActiveEffect();
		setActiveEffect(tracker);
		try {
			value = computation();
			dirty = false;
		} finally {
			setActiveEffect(prevEffect);
		}
	};

	// Runs when any tracked source changes: mark stale and propagate. The
	// computation itself is deliberately NOT re-run here (laziness) unless a
	// direct subscriber needs the fresh value.
	const tracker = new SignalEffect(() => {
		if (destroyed) {
			return;
		}

		dirty = true;
		const previous = value;

		// Wake dependent effects; their re-run reads us and recomputes.
		version.update((v) => (v ?? 0) + 1);

		// Direct subscribers receive values, so they need an eager recompute.
		if (subscribers.size > 0) {
			if (dirty) {
				recompute();
			}
			if (!Object.is(previous, value)) {
				[...subscribers].forEach((subscriber) => subscriber(value));
			}
		}
	});

	const read = (() => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}

		// Register the active effect (if any) as a dependent before computing,
		// so it is woken on future invalidations.
		version();

		if (dirty) {
			recompute();
		}

		return value;
	}) as ReadonlySignal<T>;

	read.set = () => {
		throw new Error(READ_ONLY_MESSAGE);
	};

	read.update = () => {
		throw new Error(READ_ONLY_MESSAGE);
	};

	read.subscribe = (subscriber: Subscriber<T>): Unsubscriber => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}

		// Ensure source tracking is established (a never-read computed has no
		// source subscriptions yet, so invalidations would never fire).
		if (dirty) {
			recompute();
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
		version.destroy();
		subscribers.clear();
	};

	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});

	// Auto-register with the component being constructed (if any) so the
	// computed's source subscriptions are torn down when that component is
	// destroyed. Mirrors form/select registration. Outside a component scope,
	// the caller owns the lifetime.
	getActiveComponent()?.registerDisposable(read);

	return read;
}
