import { SIGNAL_MARKER, type Signal } from '../types/signal.type';
import type { Subscriber } from '../types/subscriber.type';
import { getActiveEffect } from './active-effect.functions';

export function signal<T>(initialValue: T): Signal<T>;
export function signal<T>(): Signal<T | undefined>;
export function signal<T>(initialValue?: T): Signal<T | undefined> {
	let value = initialValue;
	const subscribers = new Set<Subscriber<T | undefined>>();

	const notify = (): void => {
		const subscribersToNotify = [...subscribers];
		subscribersToNotify.forEach((subscriber) => subscriber(value));
	};

	const read = (() => {
		const activeEffect = getActiveEffect();
		if (activeEffect) {
			activeEffect.addDependency<T | undefined>(read);
			subscribers.add(activeEffect.run);
		}

		return value;
	}) as Signal<T | undefined>;

	read.set = (newValue: T | undefined): void => {
		if (value !== newValue) {
			value = newValue;
			notify();
		}
	};

	read.update = (updater: (current: T | undefined) => T | undefined): void => {
		read.set(updater(value));
	};

	read.subscribe = (subscriber: Subscriber<T | undefined>): (() => void) => {
		subscribers.add(subscriber);
		return () => subscribers.delete(subscriber);
	};

	read.unsubscribe = (subscriber: Subscriber<T | undefined>): void => {
		subscribers.delete(subscriber);
	};

	read.destroy = (): void => {
		subscribers.clear();
	};

	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});

	return read;
}
