import { createAction, props } from '../../../src/state';

export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');
export const reset = createAction('[Counter] Reset');
export const setCount = createAction('[Counter] Set Count', props<{ count: number }>());
export const incrementAsync = createAction('[Counter] Increment Async');
export const incrementAsyncSuccess = createAction('[Counter] Increment Async Success');
