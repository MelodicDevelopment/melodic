import { SIGNAL_MARKER, type Signal } from '../types/signal.type';
import type { Subscriber } from '../types/subscriber.type';
import { getActiveEffect } from './active-effect.functions';

export const signal = <T>(initialValue: T): Signal<T> => {
	let _value = initialValue;
	const _subscribers = new Set<Subscriber<T>>();

	const notify = (): void => {
		_subscribers.forEach((subscriber) => subscriber(_value));
	};

	const read = (() => {
		const activeEffect = getActiveEffect();
		if (activeEffect) {
			activeEffect.addDependency<T>(read);
			_subscribers.add(activeEffect.execute);
		}

		return _value;
	}) as Signal<T>;

	read.set = (newValue: T): void => {
		if (_value !== newValue) {
			_value = newValue;
			notify();
		}
	};

	read.update = (updater: (current: T) => T): void => {
		read.set(updater(_value));
	};

	read.subscribe = (subscriber: Subscriber<T>): (() => void) => {
		_subscribers.add(subscriber);
		return () => _subscribers.delete(subscriber);
	};

	read.unsubscribe = (subscriber: Subscriber<T>): void => {
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
};
