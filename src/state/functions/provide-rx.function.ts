import type { Provider } from '../../bootstrap/types/provider.type';
import type { InjectionEngine } from '../../injection';
import { RX_INIT_STATE, RX_ACTION_PROVIDERS, RX_EFFECTS_PROVIDERS, RX_STATE_DEBUG } from '../injection.tokens';
import { SignalStoreService } from '../services';
import type { State, ActionReducerMap, ActionEffectsMap } from '../types';

export function provideRX<S>(initState: State<S>, actionReducers: ActionReducerMap<S>, effects: ActionEffectsMap<S>, debug: boolean = false): Provider {
	return (injector: InjectionEngine) => {
		injector.bindValue(RX_INIT_STATE, initState);
		injector.bindValue(RX_ACTION_PROVIDERS, actionReducers);
		injector.bindValue(RX_EFFECTS_PROVIDERS, effects);
		injector.bindValue(RX_STATE_DEBUG, debug);
		injector.bind(SignalStoreService, SignalStoreService, { dependencies: [RX_INIT_STATE, RX_ACTION_PROVIDERS, RX_EFFECTS_PROVIDERS] });
	};
}
