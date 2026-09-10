import type { ValidatorFn, AsyncValidatorFn, ValidationErrors, MessageValue } from '../types/validation.types';
import { setDefaultMessage } from '../messages/messages-registry';

export interface ICreateValidatorOptions {
	/**
	 * Also write the default message into the global message registry, where
	 * it applies to every control that produces this code (default `false`).
	 *
	 * The message is always attached to the validator itself, so controls using
	 * *this* validator resolve it without touching global state — two
	 * validators can share a code and keep different wording.
	 */
	global?: boolean;
}

/**
 * Build a validator for one error `code`.
 *
 * ```typescript
 * const noSpaces = createValidator('noSpaces', (v: string) => !/\s/.test(v), 'No spaces allowed');
 * ```
 */
export function createValidator<T>(
	code: string,
	validationFn: (value: T) => boolean,
	defaultMessage?: MessageValue,
	options: ICreateValidatorOptions = {}
): ValidatorFn<T> {
	if (defaultMessage !== undefined && options.global) {
		setDefaultMessage(code, defaultMessage);
	}

	const validator = ((value: T): ValidationErrors | null => {
		if (validationFn(value)) {
			return null;
		}
		return { [code]: { code } };
	}) as ValidatorFn<T>;

	if (defaultMessage !== undefined) {
		Object.defineProperty(validator, 'messages', { value: { [code]: defaultMessage }, enumerable: false });
	}

	return validator;
}

export function createAsyncValidator<T>(
	code: string,
	validationFn: (value: T) => Promise<boolean>,
	defaultMessage?: MessageValue,
	options: ICreateValidatorOptions = {}
): AsyncValidatorFn<T> {
	if (defaultMessage !== undefined && options.global) {
		setDefaultMessage(code, defaultMessage);
	}

	const validator = (async (value: T): Promise<ValidationErrors | null> => {
		if (await validationFn(value)) {
			return null;
		}
		return { [code]: { code } };
	}) as AsyncValidatorFn<T>;

	if (defaultMessage !== undefined) {
		Object.defineProperty(validator, 'messages', { value: { [code]: defaultMessage }, enumerable: false });
	}

	return validator;
}
