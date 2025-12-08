import { Injectable } from '../../../src/injection';
import { ComponentStateBaseService, createAction, createReducerFactory, props } from '../../../src/state';

// State interface
export interface MyAppState {
	count: number;
	lastAction: string | null;
}

const initialState: MyAppState = {
	count: 0,
	lastAction: null
};

// Actions
export const increment = createAction('[MyApp] Increment');
export const decrement = createAction('[MyApp] Decrement');
export const reset = createAction('[MyApp] Reset');
export const setCount = createAction('[MyApp] Set Count', props<{ count: number }>());
export const incrementAsync = createAction('[MyApp] Increment Async');
export const incrementAsyncSuccess = createAction('[MyApp] Increment Async Success');

// Reducers - use factory to bind state type
const on = createReducerFactory<MyAppState>();

const reducers = [
	on(increment, (state) => ({
		...state,
		count: state.count + 1,
		lastAction: 'increment'
	})),
	on(decrement, (state) => ({
		...state,
		count: state.count - 1,
		lastAction: 'decrement'
	})),
	on(reset, (state) => ({
		...state,
		count: 0,
		lastAction: 'reset'
	})),
	on(setCount, (state, action) => ({
		...state,
		count: action.payload.count,
		lastAction: `set to ${action.payload.count}`
	})),
	on(incrementAsyncSuccess, (state) => ({
		...state,
		count: state.count + 1,
		lastAction: 'async increment'
	}))
];

@Injectable()
export class MyAppStateService extends ComponentStateBaseService<MyAppState> {
	// Selectors
	count = this.select((state) => state.count);
	lastAction = this.select((state) => state.lastAction);

	constructor() {
		super(initialState, reducers, true);

		// Register async effect
		this.addEffect([incrementAsync], async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			console.log('[MyAppState] Async increment completed');
			return incrementAsyncSuccess();
		});
	}

	// Public methods for dispatching actions
	increment(): void {
		this.dispatch(increment());
	}

	decrement(): void {
		this.dispatch(decrement());
	}

	reset(): void {
		this.dispatch(reset());
	}

	incrementAsync(): void {
		this.dispatch(incrementAsync());
	}
}
