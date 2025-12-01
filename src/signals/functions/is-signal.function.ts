import { type Signal, SIGNAL_MARKER } from '../types/signal.type';

export const isSignal = <T = unknown>(value: unknown): value is Signal<T> => {
	return typeof value === 'function' && SIGNAL_MARKER in value;
};
