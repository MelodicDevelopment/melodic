import type { ValidatorFn, AsyncValidatorFn, ValidationErrors } from '../types/validation.types';

/**
 * Built-in validators for form controls
 */
export const Validators = {
	/**
	 * Requires the control to have a non-empty value
	 */
	required: <T>(value: T): ValidationErrors | null => {
		const isEmpty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

		return isEmpty
			? {
					required: {
						code: 'required',
						message: 'This field is required'
					}
				}
			: null;
	},

	/**
	 * Requires the control value to have a minimum length
	 */
	minLength: (min: number): ValidatorFn<string> => {
		return (value: string): ValidationErrors | null => {
			if (!value || value.length === 0) return null;

			return value.length < min
				? {
						minLength: {
							code: 'minLength',
							message: `Minimum length is ${min} characters`,
							params: { min, actual: value.length }
						}
					}
				: null;
		};
	},

	/**
	 * Requires the control value to have a maximum length
	 */
	maxLength: (max: number): ValidatorFn<string> => {
		return (value: string): ValidationErrors | null => {
			if (!value) return null;

			return value.length > max
				? {
						maxLength: {
							code: 'maxLength',
							message: `Maximum length is ${max} characters`,
							params: { max, actual: value.length }
						}
					}
				: null;
		};
	},

	/**
	 * Requires the control value to match a regex pattern
	 */
	pattern: (regex: RegExp): ValidatorFn<string> => {
		return (value: string): ValidationErrors | null => {
			if (!value) return null;

			return !regex.test(value)
				? {
						pattern: {
							code: 'pattern',
							message: 'Value does not match required pattern',
							params: { pattern: regex.toString() }
						}
					}
				: null;
		};
	},

	/**
	 * Requires the control value to be a valid email
	 */
	email: (value: string): ValidationErrors | null => {
		if (!value) return null;

		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

		return !emailRegex.test(value)
			? {
					email: {
						code: 'email',
						message: 'Please enter a valid email address'
					}
				}
			: null;
	},

	/**
	 * Requires the control value to be at least a minimum number
	 */
	min: (minValue: number): ValidatorFn<number> => {
		return (value: number): ValidationErrors | null => {
			if (value === null || value === undefined) return null;

			return value < minValue
				? {
						min: {
							code: 'min',
							message: `Value must be at least ${minValue}`,
							params: { min: minValue, actual: value }
						}
					}
				: null;
		};
	},

	/**
	 * Requires the control value to be at most a maximum number
	 */
	max: (maxValue: number): ValidatorFn<number> => {
		return (value: number): ValidationErrors | null => {
			if (value === null || value === undefined) return null;

			return value > maxValue
				? {
						max: {
							code: 'max',
							message: `Value must be at most ${maxValue}`,
							params: { max: maxValue, actual: value }
						}
					}
				: null;
		};
	},

	/**
	 * Requires the control value to be within a range
	 */
	range: (minValue: number, maxValue: number): ValidatorFn<number> => {
		return (value: number): ValidationErrors | null => {
			if (value === null || value === undefined) return null;

			if (value < minValue || value > maxValue) {
				return {
					range: {
						code: 'range',
						message: `Value must be between ${minValue} and ${maxValue}`,
						params: { min: minValue, max: maxValue, actual: value }
					}
				};
			}
			return null;
		};
	},

	/**
	 * Compose multiple validators into one
	 */
	compose: <T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> => {
		return (value: T): ValidationErrors | null => {
			let errors: ValidationErrors | null = null;

			for (const validator of validators) {
				const result = validator(value);
				if (result !== null) {
					errors = { ...(errors ?? {}), ...result };
				}
			}

			return errors;
		};
	},

	/**
	 * Compose async validators into one
	 */
	composeAsync: <T>(...validators: AsyncValidatorFn<T>[]): AsyncValidatorFn<T> => {
		return async (value: T): Promise<ValidationErrors | null> => {
			const results = await Promise.all(validators.map((v) => v(value)));
			let errors: ValidationErrors | null = null;

			for (const result of results) {
				if (result !== null) {
					errors = { ...(errors ?? {}), ...result };
				}
			}

			return errors;
		};
	}
};

/**
 * Factory for creating custom validators
 */
export function createValidator<T>(code: string, validationFn: (value: T) => boolean, message: string | ((value: T) => string)): ValidatorFn<T> {
	return (value: T): ValidationErrors | null => {
		if (validationFn(value)) {
			return null;
		}

		return {
			[code]: {
				code,
				message: typeof message === 'function' ? message(value) : message
			}
		};
	};
}

/**
 * Factory for creating async validators
 */
export function createAsyncValidator<T>(
	code: string,
	validationFn: (value: T) => Promise<boolean>,
	message: string | ((value: T) => string)
): AsyncValidatorFn<T> {
	return async (value: T): Promise<ValidationErrors | null> => {
		const isValid = await validationFn(value);

		if (isValid) {
			return null;
		}

		return {
			[code]: {
				code,
				message: typeof message === 'function' ? message(value) : message
			}
		};
	};
}
