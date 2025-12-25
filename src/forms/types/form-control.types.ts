import type { Signal } from '../../signals';
import type { ValidationErrors, ValidatorFn, AsyncValidatorFn, ValidationError } from './validation.types';

/**
 * Form control state flags
 */
export type FormControlState = {
	readonly dirty: boolean;
	readonly touched: boolean;
	readonly pristine: boolean;
	readonly untouched: boolean;
	readonly valid: boolean;
	readonly invalid: boolean;
	readonly pending: boolean;
	readonly disabled: boolean;
	readonly enabled: boolean;
};

/**
 * Options for creating a form control
 */
export type FormControlOptions<T> = {
	validators?: ValidatorFn<T>[];
	asyncValidators?: AsyncValidatorFn<T>[];
	disabled?: boolean;
	updateOn?: 'input' | 'blur' | 'submit';
};

/**
 * Form control interface
 */
export interface IFormControl<T = unknown> {
	readonly value: Signal<T>;
	readonly initialValue: T;
	readonly errors: Signal<ValidationErrors | null>;
	readonly state: Signal<FormControlState>;

	readonly dirty: Signal<boolean>;
	readonly touched: Signal<boolean>;
	readonly pristine: Signal<boolean>;
	readonly valid: Signal<boolean>;
	readonly invalid: Signal<boolean>;
	readonly pending: Signal<boolean>;
	readonly disabled: Signal<boolean>;

	readonly updateOn: 'input' | 'blur' | 'submit';

	setValue(value: T): void;
	patchValue(value: Partial<T>): void;
	reset(value?: T): void;
	markAsTouched(): void;
	markAsUntouched(): void;
	markAsDirty(): void;
	markAsPristine(): void;
	disable(): void;
	enable(): void;
	setValidators(validators: ValidatorFn<T>[]): void;
	setAsyncValidators(validators: AsyncValidatorFn<T>[]): void;
	addValidators(validators: ValidatorFn<T>[]): void;
	removeValidators(validators: ValidatorFn<T>[]): void;
	validate(): Promise<void>;
	getError(code: string): ValidationError | null;
	hasError(code: string): boolean;
	destroy(): void;
}

// Re-export ValidationError for convenience
export type { ValidationError } from './validation.types';
