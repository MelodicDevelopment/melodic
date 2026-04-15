import type { ValidatorFn, AsyncValidatorFn, ValidationErrors } from '../types/validation.types';
import { registerDefaultMessages } from '../messages/messages-registry';

registerDefaultMessages({
	required: 'This field is required',
	minLength: (params) => `Minimum length is ${params.min} characters`,
	maxLength: (params) => `Maximum length is ${params.max} characters`,
	pattern: 'Value does not match required pattern',
	email: 'Please enter a valid email address',
	min: (params) => `Value must be at least ${params.min}`,
	max: (params) => `Value must be at most ${params.max}`,
	range: (params) => `Value must be between ${params.min} and ${params.max}`
});

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isEmpty(value: unknown): boolean {
	return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

export const Validators = {
	required<T>(value: T): ValidationErrors | null {
		return isEmpty(value) ? { required: { code: 'required' } } : null;
	},

	minLength(min: number): ValidatorFn<string> {
		return (value: string): ValidationErrors | null => {
			if (!value || value.length === 0) return null;
			return value.length < min
				? { minLength: { code: 'minLength', params: { min, actual: value.length } } }
				: null;
		};
	},

	maxLength(max: number): ValidatorFn<string> {
		return (value: string): ValidationErrors | null => {
			if (!value) return null;
			return value.length > max
				? { maxLength: { code: 'maxLength', params: { max, actual: value.length } } }
				: null;
		};
	},

	pattern(regex: RegExp): ValidatorFn<string> {
		return (value: string): ValidationErrors | null => {
			if (!value) return null;
			return !regex.test(value)
				? { pattern: { code: 'pattern', params: { pattern: regex.toString() } } }
				: null;
		};
	},

	email(value: string): ValidationErrors | null {
		if (!value) return null;
		return !EMAIL_REGEX.test(value) ? { email: { code: 'email' } } : null;
	},

	min(minValue: number): ValidatorFn<number> {
		return (value: number): ValidationErrors | null => {
			if (value === null || value === undefined) return null;
			return value < minValue
				? { min: { code: 'min', params: { min: minValue, actual: value } } }
				: null;
		};
	},

	max(maxValue: number): ValidatorFn<number> {
		return (value: number): ValidationErrors | null => {
			if (value === null || value === undefined) return null;
			return value > maxValue
				? { max: { code: 'max', params: { max: maxValue, actual: value } } }
				: null;
		};
	},

	range(minValue: number, maxValue: number): ValidatorFn<number> {
		return (value: number): ValidationErrors | null => {
			if (value === null || value === undefined) return null;
			if (value < minValue || value > maxValue) {
				return { range: { code: 'range', params: { min: minValue, max: maxValue, actual: value } } };
			}
			return null;
		};
	},

	compose<T>(...validators: ValidatorFn<T>[]): ValidatorFn<T> {
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

	composeAsync<T>(...validators: AsyncValidatorFn<T>[]): AsyncValidatorFn<T> {
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
