import type { ActionPayload, TypedActionRef } from '../types/action.type';

export const props = <P extends ActionPayload>(): (() => P) => {
	return () => ({} as P);
};

export const createAction = <T extends string, P extends ActionPayload>(type: T, payloadFn?: () => P): TypedActionRef<T, P> => {
	return ((payload?: P) => ({ type, payload: payload ?? (payloadFn ? payloadFn() : undefined) })) as TypedActionRef<T, P>;
};
