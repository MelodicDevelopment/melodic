import { Injectable } from '../../../src/injection';
import { EffectsBase } from '../../../src/state';
import * as counterActions from './counter.actions';

@Injectable()
export class CounterEffects extends EffectsBase {
	constructor() {
		super();

		this.addEffect([counterActions.incrementAsync], () => {
			return new Promise((resolve) => {
				// Simulate an async operation (e.g., API call)
				setTimeout(() => {
					console.log('[CounterEffects] Async increment completed');
					resolve(counterActions.incrementAsyncSuccess());
				}, 1000);
			});
		});
	}
}
