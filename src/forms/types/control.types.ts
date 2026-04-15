import type { ValidatorFn, AsyncValidatorFn, MessageMap } from './validation.types';

export type UpdateOn = 'change' | 'blur' | 'submit';

export type ControlState = {
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

export type ControlOptions<T> = {
	validators?: ValidatorFn<T>[];
	asyncValidators?: AsyncValidatorFn<T>[];
	disabled?: boolean;
	updateOn?: UpdateOn;
	messages?: MessageMap;
};

export type SetValueOptions = {
	/** After setting the value, mark the control (and descendants) pristine instead of dirty. */
	markAsPristine?: boolean;
};
