import type { Subscriber } from './types/subscriber.type';
import type { Unsubscriber } from './types/unsubscriber.type';
import { getActiveEffect } from './functions/active-effect.functions';

export class Signal<T> {
	private _value: T;
	private _subscribers = new Set<Subscriber<T>>();

	constructor(initialValue: T) {
		this._value = initialValue;
	}

	get value(): T {
		/** for tracking dependencies in computed signals */
		const activeEffect = getActiveEffect();
		if (activeEffect) {
			activeEffect.dependencies.add(this);
			this._subscribers.add(activeEffect.execute);
		}

		return this._value;
	}

	set value(newValue: T) {
		if (this._value !== newValue) {
			this._value = newValue;
			this.notify();
		}
	}

	subscribe(subscriber: Subscriber<T>): Unsubscriber {
		this._subscribers.add(subscriber);
		return () => this._subscribers.delete(subscriber);
	}

	unsubscribe(subscriber: Subscriber<T>): void {
		this._subscribers.delete(subscriber);
	}

	update(updater: (current: T) => T): void {
		this.value = updater(this._value);
	}

	destroy(): void {
		this._subscribers.clear();
	}

	private notify(): void {
		this._subscribers.forEach((subscriber) => subscriber(this._value));
	}
}
