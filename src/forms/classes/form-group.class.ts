import { signal, computed, SignalEffect } from '../../signals';
import type { Signal } from '../../signals';
import type { IFormGroup, FormGroupControls, FormGroupValue, FormGroupOptions } from '../types/form-group.types';
import type { IFormControl } from '../types/form-control.types';
import type { ValidatorFn, AsyncValidatorFn, ValidationErrors, ValidationError } from '../types/validation.types';

export const FORM_GROUP_MARKER = Symbol('melodic.formGroup');

export class FormGroup<T extends Record<string, unknown> = Record<string, unknown>> implements IFormGroup<T> {
	readonly [FORM_GROUP_MARKER] = true;

	readonly controls: FormGroupControls<T>;
	readonly value: Signal<FormGroupValue<T>>;
	readonly errors: Signal<ValidationErrors | null>;

	private _validators: ValidatorFn<FormGroupValue<T>>[] = [];
	private readonly _asyncValidators: AsyncValidatorFn<FormGroupValue<T>>[] = [];
	private readonly _disabled = signal<boolean>(false);
	private readonly _controlEffects: SignalEffect[] = [];

	readonly valid: Signal<boolean>;
	readonly invalid: Signal<boolean>;
	readonly pending: Signal<boolean>;
	readonly dirty: Signal<boolean>;
	readonly touched: Signal<boolean>;
	readonly pristine: Signal<boolean>;
	readonly disabled: Signal<boolean>;

	constructor(controls: FormGroupControls<T>, options: FormGroupOptions<T> = {}) {
		this.controls = controls;
		this._validators = options.validators ?? [];
		this._asyncValidators = options.asyncValidators ?? [];
		this._disabled.set(options.disabled ?? false);

		// Create value signal that computes from all controls
		this.value = computed(() => this._computeValue());
		this.errors = signal<ValidationErrors | null>(null);

		// Setup child control watchers
		this._setupControlWatchers();

		// Computed aggregate state
		this.valid = computed(() => {
			const groupErrors = this.errors();
			if (groupErrors !== null) return false;

			return Object.values(this.controls).every((control) => (control as IFormControl).valid());
		});

		this.invalid = computed(() => !this.valid());

		this.pending = computed(() => {
			return Object.values(this.controls).some((control) => (control as IFormControl).pending());
		});

		this.dirty = computed(() => {
			return Object.values(this.controls).some((control) => (control as IFormControl).dirty());
		});

		this.touched = computed(() => {
			return Object.values(this.controls).some((control) => (control as IFormControl).touched());
		});

		this.pristine = computed(() => !this.dirty());
		this.disabled = computed(() => this._disabled());

		// Run initial validation
		this._runGroupValidation();
	}

	get<K extends keyof T>(name: K): IFormControl<T[K]> {
		return this.controls[name];
	}

	addControl<K extends string, V>(name: K, control: IFormControl<V>): void {
		(this.controls as Record<string, IFormControl<unknown>>)[name] = control;
		this._setupControlWatcher(name, control);
	}

	removeControl<K extends keyof T>(name: K): void {
		delete (this.controls as Record<string, IFormControl<unknown>>)[name as string];
	}

	contains<K extends keyof T>(name: K): boolean {
		return name in this.controls;
	}

	setValue(value: FormGroupValue<T>): void {
		Object.keys(value).forEach((key) => {
			const control = this.controls[key as keyof T];
			if (control) {
				control.setValue(value[key as keyof T]);
			}
		});
	}

	patchValue(value: Partial<FormGroupValue<T>>): void {
		Object.keys(value).forEach((key) => {
			const control = this.controls[key as keyof T];
			if (control && value[key as keyof T] !== undefined) {
				control.setValue(value[key as keyof T]!);
			}
		});
	}

	reset(value?: Partial<FormGroupValue<T>>): void {
		Object.keys(this.controls).forEach((key) => {
			const control = this.controls[key as keyof T];
			const resetValue = value?.[key as keyof T];
			control.reset(resetValue);
		});
	}

	markAllAsTouched(): void {
		Object.values(this.controls).forEach((control) => {
			(control as IFormControl).markAsTouched();
		});
	}

	markAllAsUntouched(): void {
		Object.values(this.controls).forEach((control) => {
			(control as IFormControl).markAsUntouched();
		});
	}

	markAllAsDirty(): void {
		Object.values(this.controls).forEach((control) => {
			(control as IFormControl).markAsDirty();
		});
	}

	markAllAsPristine(): void {
		Object.values(this.controls).forEach((control) => {
			(control as IFormControl).markAsPristine();
		});
	}

	disable(): void {
		this._disabled.set(true);
		Object.values(this.controls).forEach((control) => {
			(control as IFormControl).disable();
		});
	}

	enable(): void {
		this._disabled.set(false);
		Object.values(this.controls).forEach((control) => {
			(control as IFormControl).enable();
		});
	}

	async validate(): Promise<void> {
		await Promise.all(Object.values(this.controls).map((control) => (control as IFormControl).validate()));
		await this._runGroupValidation();
	}

	setValidators(validators: ValidatorFn<FormGroupValue<T>>[]): void {
		this._validators = validators;
		this._runGroupValidation();
	}

	getError(code: string): ValidationError | null {
		return this.errors()?.[code] ?? null;
	}

	hasError(code: string): boolean {
		return this.errors()?.[code] !== undefined;
	}

	destroy(): void {
		this._controlEffects.forEach((effect) => effect.destroy());
		Object.values(this.controls).forEach((control) => {
			(control as IFormControl).destroy();
		});
	}

	private _computeValue(): FormGroupValue<T> {
		const result: Partial<FormGroupValue<T>> = {};
		Object.keys(this.controls).forEach((key) => {
			const control = this.controls[key as keyof T];
			result[key as keyof T] = control.value();
		});
		return result as FormGroupValue<T>;
	}

	private _setupControlWatchers(): void {
		Object.keys(this.controls).forEach((key) => {
			this._setupControlWatcher(key, this.controls[key as keyof T]);
		});
	}

	private _setupControlWatcher<K extends string>(_name: K, control: IFormControl<unknown>): void {
		const effect = new SignalEffect(() => {
			control.value();
			this._runGroupValidation();
		});
		effect.run();
		this._controlEffects.push(effect);
	}

	private async _runGroupValidation(): Promise<void> {
		const value = this._computeValue();
		let errors: ValidationErrors | null = null;

		for (const validator of this._validators) {
			const result = validator(value);
			if (result !== null) {
				errors = { ...(errors ?? {}), ...result };
			}
		}

		// Run async group validators
		if (this._asyncValidators.length > 0 && errors === null) {
			const asyncResults = await Promise.all(this._asyncValidators.map((v) => v(value)));

			for (const result of asyncResults) {
				if (result !== null) {
					errors = { ...(errors ?? {}), ...result };
				}
			}
		}

		this.errors.set(errors);
	}
}
