import { DEPENDENTS, SIGNAL_MARKER, type IDependent, type Signal } from '../types/signal.type';
import type { Subscriber } from '../types/subscriber.type';
import { getActiveEffect } from './active-effect.functions';
import { flush, scheduleNotify } from './batch.function';

const DESTROYED_MESSAGE =
	'Signal accessed after destruction. Holding a signal beyond its owning component (e.g. cached on a long-lived service) is a bug — the signal is destroyed when its component disconnects.';

/**
 * Call every subscriber even if one throws; rethrow afterwards so the caller
 * still sees the failure without unrelated subscribers being skipped.
 */
export function notifyAll<T>(subscribers: Iterable<Subscriber<T>>, value: T): void {
	const errors: unknown[] = [];

	for (const subscriber of subscribers) {
		try {
			subscriber(value);
		} catch (error) {
			errors.push(error);
		}
	}

	if (errors.length === 1) {
		throw errors[0];
	}
	if (errors.length > 1) {
		throw new AggregateError(errors, `${errors.length} signal subscribers threw`);
	}
}

export function signal<T>(initialValue: T): Signal<T>;
export function signal<T>(): Signal<T | undefined>;
export function signal<T>(initialValue?: T): Signal<T | undefined> {
	let value = initialValue;
	let destroyed = false;
	const subscribers = new Set<Subscriber<T | undefined>>();
	const dependents = new Set<IDependent>();

	// Stable identity so the scheduler de-duplicates repeated writes.
	const notify = (): void => {
		notifyAll([...subscribers], value);
	};

	const read = (() => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}
		const activeEffect = getActiveEffect();
		if (activeEffect) {
			activeEffect.addDependency(read);
			dependents.add(activeEffect);
		}

		return value;
	}) as Signal<T | undefined> & { [DEPENDENTS]: Set<IDependent> };

	read.set = (newValue: T | undefined): void => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}
		if (Object.is(value, newValue)) {
			return;
		}

		value = newValue;

		// Phase 1 — invalidate: queue raw subscribers, mark every dependent.
		if (subscribers.size > 0) {
			scheduleNotify(notify);
		}
		for (const dependent of [...dependents]) {
			dependent.invalidate();
		}

		// Phase 2 — execute (a no-op inside a batch or an ongoing flush).
		flush();
	};

	read.update = (updater: (current: T | undefined) => T | undefined): void => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}
		read.set(updater(value));
	};

	read.subscribe = (subscriber: Subscriber<T | undefined>): (() => void) => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}
		subscribers.add(subscriber);
		return () => subscribers.delete(subscriber);
	};

	read.unsubscribe = (subscriber: Subscriber<T | undefined>): void => {
		subscribers.delete(subscriber);
	};

	read.destroy = (): void => {
		if (destroyed) return;
		destroyed = true;
		subscribers.clear();
		dependents.clear();
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

	return read;
}
