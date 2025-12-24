type TypeError<Message extends string> = { readonly __error__: Message };

export type ActionPayload = { [key: string]: unknown };

export type NonEmpty<S extends string> = S extends '' ? never : S;

export type ActionIdentifierPattern = `[${string}] ${string}`;

export type ActionIdentifier<S extends ActionIdentifierPattern = ActionIdentifierPattern> = S extends `[${infer actionCategory}] ${infer actionDescription}`
	? NonEmpty<actionCategory> extends never
		? TypeError<"Action must match pattern '[Category] Description'">
		: NonEmpty<actionDescription> extends never
		? TypeError<"Action must match pattern '[Category] Description'">
		: S
	: TypeError<"Action must match pattern '[Category] Description'">;

export type Action = {
	readonly type: ActionIdentifier;
	readonly payload: ActionPayload;
};

export type TypedAction<T extends ActionIdentifier, P extends ActionPayload> = Action & {
	readonly type: T;
	readonly payload: P;
};

export type ActionRef = (payload?: ActionPayload) => Action;
export type TypedActionRef<T extends ActionIdentifier, P extends ActionPayload> = ActionRef & ((payload?: P) => TypedAction<T, P>);
