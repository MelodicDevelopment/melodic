import type { ActionReducer, ActionPayload, TypedAction, TypedActionRef } from '../types';

export const onAction = <S, T extends string, P extends ActionPayload>(
	action: TypedActionRef<T, P>,
	reducer: (state: S, action: TypedAction<T, P>) => S
): ActionReducer<S, TypedAction<T, P>> => {
	return {
		action: action() as TypedAction<T, P>,
		reducer
	};
};

/**
 * Creates a typed reducer factory for a specific state type.
 * Use this when you need TypeScript to properly infer state types in reducers.
 *
 * @example
 * ```typescript
 * const on = createReducerFactory<MyState>();
 *
 * const reducers = [
 *   on(increment, (state) => ({ ...state, count: state.count + 1 })),
 *   on(decrement, (state) => ({ ...state, count: state.count - 1 }))
 * ];
 * ```
 */
export const createReducerFactory =
	<S>() =>
	<T extends string, P extends ActionPayload>(
		action: TypedActionRef<T, P>,
		reducer: (state: S, action: TypedAction<T, P>) => S
	): ActionReducer<S, TypedAction<T, P>> => {
		return {
			action: action() as TypedAction<T, P>,
			reducer
		};
	};
