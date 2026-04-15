import type { ValidatorFn, AsyncValidatorFn, ValidationErrors, MessageValue } from '../types/validation.types';
import { setDefaultMessage } from '../messages/messages-registry';

export function createValidator<T>(
	code: string,
	validationFn: (value: T) => boolean,
	defaultMessage?: MessageValue
): ValidatorFn<T> {
	if (defaultMessage !== undefined) {
		setDefaultMessage(code, defaultMessage);
	}

	return (value: T): ValidationErrors | null => {
		if (validationFn(value)) {
			return null;
		}
		return { [code]: { code } };
	};
}

export function createAsyncValidator<T>(
	code: string,
	validationFn: (value: T) => Promise<boolean>,
	defaultMessage?: MessageValue
): AsyncValidatorFn<T> {
	if (defaultMessage !== undefined) {
		setDefaultMessage(code, defaultMessage);
	}

	return async (value: T): Promise<ValidationErrors | null> => {
		if (await validationFn(value)) {
			return null;
		}
		return { [code]: { code } };
	};
}
