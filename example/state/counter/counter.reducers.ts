import { createReducer, onAction } from '../../../src/state';
import type { AppState } from '../app.state';
import * as counterActions from './counter.actions';

export const counterReducers = createReducer<AppState, 'counter'>(
	onAction(counterActions.increment, (state) => ({
		...state,
		count: state.count + 1,
		lastAction: 'increment'
	})),
	onAction(counterActions.decrement, (state) => ({
		...state,
		count: state.count - 1,
		lastAction: 'decrement'
	})),
	onAction(counterActions.reset, (state) => ({
		...state,
		count: 0,
		lastAction: 'reset'
	})),
	onAction(counterActions.setCount, (state, action) => ({
		...state,
		count: action.payload.count,
		lastAction: `set to ${action.payload.count}`
	})),
	onAction(counterActions.incrementAsyncSuccess, (state) => ({
		...state,
		count: state.count + 1,
		lastAction: 'async increment'
	}))
);
