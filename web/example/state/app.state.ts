import type { ActionEffectsMap, ActionReducerMap, State } from '../../../src/state';
import { createState } from '../../../src/state';
import { type TodosState, initialTodosState, todosReducers, TodosEffects } from './todos';

export interface AppState {
	todos: TodosState;
}

const initialAppState: AppState = {
	todos: initialTodosState
};

export const appState: State<AppState> = createState<AppState>(initialAppState);

export const appReducers: ActionReducerMap<AppState> = {
	todos: todosReducers
};

export const appEffects: ActionEffectsMap<AppState> = {
	todos: TodosEffects
};
