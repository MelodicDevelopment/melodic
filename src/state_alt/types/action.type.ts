import type { ActionPayload } from './action-payload.type';

export type TypedAction<T extends string, P extends ActionPayload> = {
	readonly type: T;
	readonly payload: P;
};
