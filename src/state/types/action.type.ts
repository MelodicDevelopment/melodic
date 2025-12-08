export type ActionPayload = { [key: string]: unknown };

export type Action = {
	readonly type: string;
	readonly payload: ActionPayload;
};

export type TypedAction<T extends string, P extends ActionPayload> = Action & {
	readonly type: T;
	readonly payload: P;
};

export type ActionRef = (payload?: ActionPayload) => Action;
export type TypedActionRef<T extends string, P extends ActionPayload> = ActionRef & ((payload?: P) => TypedAction<T, P>);
