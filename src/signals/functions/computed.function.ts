import { signal } from '../functions/signal.function';
import { SignalEffect } from '../signal-effect.class';
import type { Signal } from '../types/signal.type';

export function computed<T>(computation: () => T): Signal<T> {
	const computedSignal = signal<T>(undefined as T);

	const effect = new SignalEffect(() => {
		computedSignal.set(computation());
	});

	effect.run();

	const originalDestroy = computedSignal.destroy;

	computedSignal.destroy = () => {
		effect.destroy();
		originalDestroy();
	};

	return computedSignal;
}
