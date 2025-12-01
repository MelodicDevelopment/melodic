/**
 * Function-based Signal implementation (Angular/Solid.js style)
 * Allows calling signals like functions: count() instead of count.value
 */

type Subscriber<T> = (value: T) => void;
type Cleanup = () => void;

// Global effect tracking (for computed signals)
let activeEffect: Effect | null = null;

class Effect {
	dependencies = new Set<SignalGetter<any>>();

	constructor(public execute: () => void) {}

	run(): void {
		// Clear old dependencies
		this.dependencies.forEach((signal) => {
			(signal as any)._unsubscribe?.(this.execute);
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
			(signal as any)._unsubscribe?.(this.execute);
		});
		this.dependencies.clear();
	}
}

/**
 * Signal getter function type
 * Can be called as a function to read the value
 * Has methods to update the value
 */
export type SignalGetter<T> = {
	(): T; // Call to read value
	set(value: T): void; // Set new value
	update(updater: (current: T) => T): void; // Update based on current value
	subscribe(subscriber: Subscriber<T>): Cleanup; // Subscribe to changes
	destroy(): void; // Clean up all subscriptions
};

/**
 * Create a reactive signal
 * @param initialValue The initial value of the signal
 * @returns A function that can be called to read the value, with methods to update it
 */
export function signal<T>(initialValue: T): SignalGetter<T> {
	let _value = initialValue;
	const _subscribers = new Set<Subscriber<T>>();

	// The main getter function
	const read = (() => {
		// Track this signal access if we're in a reactive context
		if (activeEffect) {
			activeEffect.dependencies.add(read);
			_subscribers.add(activeEffect.execute);
		}
		return _value;
	}) as SignalGetter<T>;

	// Set a new value
	read.set = (newValue: T) => {
		if (_value !== newValue) {
			_value = newValue;
			notify();
		}
	};

	// Update based on current value
	read.update = (updater: (current: T) => T) => {
		read.set(updater(_value));
	};

	// Subscribe to changes
	read.subscribe = (subscriber: Subscriber<T>): Cleanup => {
		_subscribers.add(subscriber);
		return () => _subscribers.delete(subscriber);
	};

	// Clean up all subscriptions
	read.destroy = () => {
		_subscribers.clear();
	};

	// Internal: Notify subscribers
	const notify = () => {
		_subscribers.forEach((subscriber) => subscriber(_value));
	};

	// Internal: Unsubscribe a specific subscriber (for effects)
	(read as any)._unsubscribe = (subscriber: Subscriber<T>) => {
		_subscribers.delete(subscriber);
	};

	return read;
}

/**
 * Create a computed signal that derives its value from other signals
 * @param computation Function that computes the value
 * @returns A signal getter that automatically updates when dependencies change
 */
export function computed<T>(computation: () => T): SignalGetter<T> {
	const computedSignal = signal<T>(undefined as T);

	const effect = new Effect(() => {
		computedSignal.set(computation());
	});

	effect.run(); // Initial computation

	// Store effect for cleanup
	(computedSignal as any)._effect = effect;

	// Override destroy to clean up effect
	const originalDestroy = computedSignal.destroy;
	computedSignal.destroy = () => {
		effect.destroy();
		originalDestroy();
	};

	return computedSignal;
}

/**
 * Example Usage:
 *
 * // Create signals
 * const count = signal(0);
 * const name = signal('John');
 *
 * // Read value by calling the function
 * console.log(count());  // 0
 * console.log(name());   // 'John'
 *
 * // Update value
 * count.set(5);
 * name.set('Jane');
 *
 * // Update based on current value
 * count.update(v => v + 1);
 *
 * // Computed signals
 * const doubled = computed(() => count() * 2);
 * const greeting = computed(() => `Hello, ${name()}!`);
 *
 * console.log(doubled());   // 10
 * console.log(greeting());  // 'Hello, Jane!'
 *
 * // Subscribe to changes
 * const cleanup = count.subscribe((value) => {
 *   console.log('Count changed:', value);
 * });
 *
 * count.set(10);  // Logs: 'Count changed: 10'
 *
 * // Clean up
 * cleanup();
 * count.destroy();
 *
 * // In templates:
 * html`
 *   <div>Count: ${component.count()}</div>
 *   <div>Doubled: ${component.doubled()}</div>
 *   <div>Greeting: ${component.greeting()}</div>
 * `
 */
