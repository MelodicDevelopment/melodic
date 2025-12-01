import { signal } from '../functions/signal.function';
import { Effect } from '../effect.class';
import type { Signal } from '../types/signal.type';

export function computed<T>(computation: () => T): Signal<T> {
	const computedSignal = signal<T>(undefined as T);

	const effect = new Effect(() => {
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
