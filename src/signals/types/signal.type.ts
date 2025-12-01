import type { Subscriber } from './subscriber.type';
import type { Unsubscriber } from './unsubscriber.type';

export type Signal<T> = {
	(): T;
	set(value: T): void;
	update(updater: (current: T) => T): void;
	subscribe(subscriber: Subscriber<T>): Unsubscriber;
	unsubscribe(subscriber: Subscriber<T>): void;
	destroy(): void;
};

export const SIGNAL_MARKER = Symbol('melodic.signal');
