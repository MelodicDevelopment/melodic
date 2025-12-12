import { SIGNAL_MARKER, type Signal } from '../types/signal.type';
import type { Subscriber } from '../types/subscriber.type';
import { getActiveEffect } from './active-effect.functions';

// Overload: when initial value is provided, return Signal<T>
export function signal<T>(initialValue: T): Signal<T>;

// Overload: when no initial value, return Signal<T | undefined>
export function signal<T>(): Signal<T | undefined>;

// Implementation signature
export function signal<T>(initialValue?: T): Signal<T | undefined> {
	let _value = initialValue;
	const _subscribers = new Set<Subscriber<T | undefined>>();

	const notify = (): void => {
		// Copy subscribers to avoid issues if subscribers modify the set during iteration
		const subscribersToNotify = [..._subscribers];
		subscribersToNotify.forEach((subscriber) => subscriber(_value));
	};

	const read = (() => {
		const activeEffect = getActiveEffect();
		if (activeEffect) {
			activeEffect.addDependency<T | undefined>(read);
			// Subscribe to run() instead of execute() so that re-execution
			// happens within a tracking context and dynamic dependencies are captured
			_subscribers.add(activeEffect.run);
		}

		return _value;
	}) as Signal<T | undefined>;

	read.set = (newValue: T | undefined): void => {
		if (_value !== newValue) {
			_value = newValue;
			notify();
		}
	};

	read.update = (updater: (current: T | undefined) => T | undefined): void => {
		read.set(updater(_value));
	};

	read.subscribe = (subscriber: Subscriber<T | undefined>): (() => void) => {
		_subscribers.add(subscriber);
		return () => _subscribers.delete(subscriber);
	};

	read.unsubscribe = (subscriber: Subscriber<T | undefined>): void => {
		_subscribers.delete(subscriber);
	};

	read.destroy = (): void => {
		_subscribers.clear();
	};

	Object.defineProperty(read, SIGNAL_MARKER, {
		value: true,
		enumerable: false,
		configurable: false
	});

	return read;
}
