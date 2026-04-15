export type ValidationError = {
	readonly code: string;
	readonly params?: Record<string, unknown>;
};

export type ValidationErrors = Record<string, ValidationError>;

export type ValidatorFn<T = unknown> = (value: T) => ValidationErrors | null;

export type AsyncValidatorFn<T = unknown> = (value: T) => Promise<ValidationErrors | null>;

export type MessageResolver = (params: Record<string, unknown>) => string;

export type MessageValue = string | MessageResolver;

export type MessageMap = Record<string, MessageValue>;
