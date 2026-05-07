import { SIGNAL_MARKER, type Signal } from '../types/signal.type';
import type { Subscriber } from '../types/subscriber.type';
import { getActiveEffect } from './active-effect.functions';

const DESTROYED_MESSAGE =
	'Signal accessed after destruction. Holding a signal beyond its owning component (e.g. cached on a long-lived service) is a bug — the signal is destroyed when its component disconnects.';

export function signal<T>(initialValue: T): Signal<T>;
export function signal<T>(): Signal<T | undefined>;
export function signal<T>(initialValue?: T): Signal<T | undefined> {
	let value = initialValue;
	let destroyed = false;
	const subscribers = new Set<Subscriber<T | undefined>>();

	const notify = (): void => {
		const subscribersToNotify = [...subscribers];
		subscribersToNotify.forEach((subscriber) => subscriber(value));
	};

	const read = (() => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}
		const activeEffect = getActiveEffect();
		if (activeEffect) {
			activeEffect.addDependency<T | undefined>(read);
			subscribers.add(activeEffect.run);
		}

		return value;
	}) as Signal<T | undefined>;

	read.set = (newValue: T | undefined): void => {
		if (destroyed) {
			throw new Error(DESTROYED_MESSAGE);
		}
		if (value !== newValue) {
			value = newValue;
			notify();
		}
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
	};

	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});

	return read;
}
