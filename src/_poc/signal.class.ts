/**
 * Signal implementation for Melodic framework
 * Provides reactive state management with automatic cleanup
 */

type Subscriber<T> = (value: T) => void;
type Cleanup = () => void;

export class Signal<T> {
	private _value: T;
	private _subscribers = new Set<Subscriber<T>>();

	constructor(initialValue: T) {
		this._value = initialValue;
	}

	get value(): T {
		// Track this signal access if we're in a reactive context
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

	/**
	 * Subscribe to signal changes
	 * @returns Cleanup function to unsubscribe
	 */
	subscribe(subscriber: Subscriber<T>): Cleanup {
		this._subscribers.add(subscriber);
		return () => this._subscribers.delete(subscriber);
	}

	/**
	 * Update the value using a function
	 */
	update(updater: (current: T) => T): void {
		this.value = updater(this._value);
	}

	private notify(): void {
		this._subscribers.forEach((subscriber) => subscriber(this._value));
	}

	/**
	 * Clean up all subscriptions
	 */
	destroy(): void {
		this._subscribers.clear();
	}
}

// Global effect tracking for computed signals
let activeEffect: Effect | null = null;

class Effect {
	dependencies = new Set<Signal<any>>();

	constructor(public execute: () => void) {}

	run(): void {
		// Clear old dependencies
		this.dependencies.forEach((signal) => {
			signal['_subscribers'].delete(this.execute);
		});
		this.dependencies.clear();

		// Track new dependencies
		const prevEffect = activeEffect;
		activeEffect = this;
		this.execute();
		activeEffect = prevEffect;
	}

	destroy(): void {
		this.dependencies.forEach((signal) => {
			signal['_subscribers'].delete(this.execute);
		});
		this.dependencies.clear();
	}
}

/**
 * Create a computed signal that derives its value from other signals
 */
export function computed<T>(computation: () => T): Signal<T> {
	const signal = new Signal<T>(undefined as T);

	const effect = new Effect(() => {
		signal.value = computation();
	});

	effect.run(); // Initial computation

	// Store effect for cleanup
	(signal as any)._effect = effect;

	// Override destroy to clean up effect
	const originalDestroy = signal.destroy.bind(signal);
	signal.destroy = () => {
		effect.destroy();
		originalDestroy();
	};

	return signal;
}

/**
 * Helper to create a signal
 */
export function signal<T>(initialValue: T): Signal<T> {
	return new Signal(initialValue);
}
