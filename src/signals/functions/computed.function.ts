import { Effect } from '../effect.class';
import { Signal } from '../signal.class';

export function computed<T>(computation: () => T): Signal<T> {
	const signal = new Signal<T>(undefined as T);

	const effect = new Effect(() => {
		signal.value = computation();
	});

	effect.run();

	const originalDestroy = signal.destroy.bind(signal);

	signal.destroy = () => {
		effect.destroy();
		originalDestroy();
	};

	return signal;
}
