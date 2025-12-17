import type { ActionPayload } from './action-payload.type';

export type Action = {
	readonly type: string;
	readonly payload: ActionPayload;
};

export type TypedAction<T extends string, P extends ActionPayload> = Action & {
	readonly type: T;
	readonly payload: P;
};
