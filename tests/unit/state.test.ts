import { describe, it, expect } from 'vitest';
import type { ReducerConfig } from '../../src/state/types/reducer-config.type';
import type { Action } from '../../src/state/types/action.type';
import { ComponentStateBaseService } from '../../src/state/services/component-state-base.service';

const increment = (payload: { amount: number } = { amount: 1 }) => ({
	type: '[Counter] Increment',
	payload
} as const);

const setValue = (payload: { value: number } = { value: 0 }) => ({
	type: '[Counter] Set',
	payload
} as const);

type CounterAction = ReturnType<typeof increment> | ReturnType<typeof setValue>;

type CounterState = {
	count: number;
};

const reducerConfig: ReducerConfig<CounterState, CounterAction> = {
	reducers: [
		{
			action: increment(),
			reducer: (state, action) => ({ count: state.count + action.payload.amount })
		},
		{
			action: setValue(),
			reducer: (_state, action) => ({ count: action.payload.value })
		}
	]
};

class CounterStore extends ComponentStateBaseService<CounterState> {
	constructor() {
		super({ count: 0 }, reducerConfig, false);
		this.addEffect([increment], async () => setValue({ value: 10 }));
	}

	getCount(): number {
		return this.state.count;
	}
}

describe('component state', () => {
	it('reduces actions and runs effects', async () => {
		const store = new CounterStore();
		const countSignal = store.select((state) => state.count);

		expect(countSignal()).toBe(0);
		store.dispatch(increment({ amount: 2 }) as Action);
		expect(countSignal()).toBe(2);

		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(store.getCount()).toBe(10);
	});
});
