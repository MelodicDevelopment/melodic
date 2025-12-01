import { Signal } from '../signal.class';

/**
 * Helper to create a signal
 */
export function signal<T>(initialValue: T): Signal<T> {
	return new Signal(initialValue);
}
