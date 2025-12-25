/**
 * Validation error with code, message, and optional parameters
 */
export type ValidationError = {
	readonly code: string;
	readonly message: string;
	readonly params?: Record<string, unknown>;
};

/**
 * Map of validation errors keyed by validator name
 */
export type ValidationErrors = Record<string, ValidationError>;

/**
 * Synchronous validator function
 */
export type ValidatorFn<T = unknown> = (value: T) => ValidationErrors | null;

/**
 * Asynchronous validator function
 */
export type AsyncValidatorFn<T = unknown> = (value: T) => Promise<ValidationErrors | null>;
