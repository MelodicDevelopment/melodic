import { signal } from '../functions/signal.function';
import { SignalEffect } from '../classes/signal-effect.class';
import type { Signal } from '../types/signal.type';
import { getActiveComponent } from '../../components/functions/active-component.functions';

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

	// Auto-register with the component being constructed (if any) so the
	// computed's effect — and its subscriptions to source signals — are torn
	// down when that component is destroyed. Mirrors form/select registration.
	// Outside a component scope, the caller owns the lifetime.
	getActiveComponent()?.registerDisposable(computedSignal);

	return computedSignal;
}
