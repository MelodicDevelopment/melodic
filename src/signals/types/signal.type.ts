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

/**
 * Hidden property on every signal/computed holding the set of effects that
 * read it under tracking. Effects use it to unsubscribe themselves when their
 * dependencies are reset. Internal — not part of the public `Signal` type.
 */
export const DEPENDENTS = Symbol('melodic.signal.dependents');

/** An effect-like consumer a producer can invalidate. */
export interface IDependent {
	invalidate(): void;
}

/** A signal or computed as seen by the effect that tracks it. */
export interface IProducer {
	[DEPENDENTS]: Set<IDependent>;
}
