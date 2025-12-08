import type { ActionEffectsMap, ActionReducerMap, State } from '../../src/state';
import { createState } from '../../src/state';
import { type CounterState, initialCounterState, counterReducers, CounterEffects } from './counter';

export interface AppState {
	counter: CounterState;
}

const initialAppState: AppState = {
	counter: initialCounterState
};

export const appState: State<AppState> = createState<AppState>(initialAppState);

export const appReducers: ActionReducerMap<AppState> = {
	counter: counterReducers
};

export const appEffects: ActionEffectsMap<AppState> = {
	counter: CounterEffects
};
