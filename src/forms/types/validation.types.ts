export type ValidationError = {
	readonly code: string;
	readonly params?: Record<string, unknown>;
};

export type ValidationErrors = Record<string, ValidationError>;

export type ValidatorFn<T = unknown> = ((value: T) => ValidationErrors | null) & {
	/**
	 * Default messages this validator ships for the codes it produces. Set by
	 * `createValidator`; resolved ahead of the global registry so two
	 * validators using the same code can carry different wording without one
	 * overwriting the other's global entry.
	 */
	readonly messages?: MessageMap;
};

export type AsyncValidatorFn<T = unknown> = ((value: T) => Promise<ValidationErrors | null>) & {
	readonly messages?: MessageMap;
};

export type MessageResolver = (params: Record<string, unknown>) => string;

export type MessageValue = string | MessageResolver;

export type MessageMap = Record<string, MessageValue>;
