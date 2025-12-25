import type { Signal } from '../../signals';
import type { IFormControl } from './form-control.types';
import type { ValidatorFn, AsyncValidatorFn, ValidationErrors, ValidationError } from './validation.types';

/**
 * Map of form controls keyed by field name
 */
export type FormGroupControls<T> = {
	[K in keyof T]: IFormControl<T[K]>;
};

/**
 * Value type extracted from form group
 */
export type FormGroupValue<T> = {
	[K in keyof T]: T[K];
};

/**
 * Options for creating a form group
 */
export type FormGroupOptions<T> = {
	validators?: ValidatorFn<FormGroupValue<T>>[];
	asyncValidators?: AsyncValidatorFn<FormGroupValue<T>>[];
	disabled?: boolean;
};

/**
 * Form group interface
 */
export interface IFormGroup<T extends Record<string, unknown> = Record<string, unknown>> {
	readonly controls: FormGroupControls<T>;
	readonly value: Signal<FormGroupValue<T>>;
	readonly errors: Signal<ValidationErrors | null>;

	readonly valid: Signal<boolean>;
	readonly invalid: Signal<boolean>;
	readonly pending: Signal<boolean>;
	readonly dirty: Signal<boolean>;
	readonly touched: Signal<boolean>;
	readonly pristine: Signal<boolean>;
	readonly disabled: Signal<boolean>;

	get<K extends keyof T>(name: K): IFormControl<T[K]>;
	addControl<K extends string, V>(name: K, control: IFormControl<V>): void;
	removeControl<K extends keyof T>(name: K): void;
	contains<K extends keyof T>(name: K): boolean;

	setValue(value: FormGroupValue<T>): void;
	patchValue(value: Partial<FormGroupValue<T>>): void;
	reset(value?: Partial<FormGroupValue<T>>): void;

	markAllAsTouched(): void;
	markAllAsUntouched(): void;
	markAllAsDirty(): void;
	markAllAsPristine(): void;
	disable(): void;
	enable(): void;

	validate(): Promise<void>;
	setValidators(validators: ValidatorFn<FormGroupValue<T>>[]): void;
	getError(code: string): ValidationError | null;
	hasError(code: string): boolean;

	destroy(): void;
}
