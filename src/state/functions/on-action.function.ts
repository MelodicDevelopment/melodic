import type { ActionReducer, ActionPayload, TypedAction, TypedActionRef, ActionIdentifier } from '../types';

export const onAction = <S, T extends ActionIdentifier, P extends ActionPayload>(
	action: TypedActionRef<T, P>,
	reducer: (state: S, action: TypedAction<T, P>) => S
): ActionReducer<S, TypedAction<T, P>> => {
	return {
		action: action() as TypedAction<T, P>,
		reducer
	};
};
