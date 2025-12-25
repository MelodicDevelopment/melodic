import { signal, computed } from '../../signals';
import type { Signal } from '../../signals';
import type { IFormControl, FormControlOptions, FormControlState } from '../types/form-control.types';
import type { ValidatorFn, AsyncValidatorFn, ValidationErrors, ValidationError } from '../types/validation.types';

export const FORM_CONTROL_MARKER = Symbol('melodic.formControl');

export class FormControl<T = unknown> implements IFormControl<T> {
	readonly [FORM_CONTROL_MARKER] = true;

	readonly value: Signal<T>;
	readonly initialValue: T;
	readonly errors: Signal<ValidationErrors | null>;
	readonly updateOn: 'input' | 'blur' | 'submit';

	private _validators: ValidatorFn<T>[] = [];
	private _asyncValidators: AsyncValidatorFn<T>[] = [];
	private readonly _touched = signal<boolean>(false);
	private readonly _dirty = signal<boolean>(false);
	private readonly _pending = signal<boolean>(false);
	private readonly _disabled = signal<boolean>(false);
	private _asyncValidationId = 0;

	readonly dirty: Signal<boolean>;
	readonly touched: Signal<boolean>;
	readonly pristine: Signal<boolean>;
	readonly valid: Signal<boolean>;
	readonly invalid: Signal<boolean>;
	readonly pending: Signal<boolean>;
	readonly disabled: Signal<boolean>;
	readonly state: Signal<FormControlState>;

	constructor(initialValue: T, options: FormControlOptions<T> = {}) {
		this.initialValue = initialValue;
		this.value = signal<T>(initialValue);
		this.errors = signal<ValidationErrors | null>(null);

		this._validators = options.validators ?? [];
		this._asyncValidators = options.asyncValidators ?? [];
		this._disabled.set(options.disabled ?? false);
		this.updateOn = options.updateOn ?? 'input';

		// Computed state signals
		this.dirty = computed(() => this._dirty());
		this.touched = computed(() => this._touched());
		this.pristine = computed(() => !this._dirty());
		this.pending = computed(() => this._pending());
		this.disabled = computed(() => this._disabled());

		this.valid = computed(() => this.errors() === null && !this._pending());
		this.invalid = computed(() => this.errors() !== null);

		this.state = computed<FormControlState>(() => ({
			dirty: this._dirty(),
			touched: this._touched(),
			pristine: !this._dirty(),
			untouched: !this._touched(),
			valid: this.errors() === null && !this._pending(),
			invalid: this.errors() !== null,
			pending: this._pending(),
			disabled: this._disabled(),
			enabled: !this._disabled()
		}));

		// Run initial validation
		this._runValidation();
	}

	setValue(value: T): void {
		if (this._disabled()) return;

		this.value.set(value);
		this._dirty.set(true);

		if (this.updateOn === 'input') {
			this._runValidation();
		}
	}

	patchValue(value: Partial<T>): void {
		if (typeof this.value() === 'object' && this.value() !== null) {
			this.setValue({ ...this.value(), ...value });
		} else {
			this.setValue(value as T);
		}
	}

	reset(value?: T): void {
		this.value.set(value ?? this.initialValue);
		this._dirty.set(false);
		this._touched.set(false);
		this.errors.set(null);
		this._runValidation();
	}

	markAsTouched(): void {
		this._touched.set(true);

		if (this.updateOn === 'blur') {
			this._runValidation();
		}
	}

	markAsUntouched(): void {
		this._touched.set(false);
	}

	markAsDirty(): void {
		this._dirty.set(true);
	}

	markAsPristine(): void {
		this._dirty.set(false);
	}

	disable(): void {
		this._disabled.set(true);
	}

	enable(): void {
		this._disabled.set(false);
	}

	setValidators(validators: ValidatorFn<T>[]): void {
		this._validators = validators;
		this._runValidation();
	}

	setAsyncValidators(validators: AsyncValidatorFn<T>[]): void {
		this._asyncValidators = validators;
		this._runValidation();
	}

	addValidators(validators: ValidatorFn<T>[]): void {
		this._validators = [...this._validators, ...validators];
		this._runValidation();
	}

	removeValidators(validators: ValidatorFn<T>[]): void {
		this._validators = this._validators.filter((v) => !validators.includes(v));
		this._runValidation();
	}

	async validate(): Promise<void> {
		await this._runValidation();
	}

	getError(code: string): ValidationError | null {
		return this.errors()?.[code] ?? null;
	}

	hasError(code: string): boolean {
		return this.errors()?.[code] !== undefined;
	}

	destroy(): void {
		this.value.destroy();
		this.errors.destroy();
		this._touched.destroy();
		this._dirty.destroy();
		this._pending.destroy();
		this._disabled.destroy();
	}

	private async _runValidation(): Promise<void> {
		const value = this.value();

		// Run sync validators
		let errors: ValidationErrors | null = null;

		for (const validator of this._validators) {
			const result = validator(value);
			if (result !== null) {
				errors = { ...(errors ?? {}), ...result };
			}
		}

		// If sync validation fails, set errors and skip async
		if (errors !== null) {
			this.errors.set(errors);
			return;
		}

		// Run async validators if any
		if (this._asyncValidators.length > 0) {
			const validationId = ++this._asyncValidationId;
			this._pending.set(true);

			try {
				const asyncResults = await Promise.all(this._asyncValidators.map((v) => v(value)));

				// Check if this is still the latest validation
				if (validationId !== this._asyncValidationId) {
					return;
				}

				for (const result of asyncResults) {
					if (result !== null) {
						errors = { ...(errors ?? {}), ...result };
					}
				}
			} finally {
				if (validationId === this._asyncValidationId) {
					this._pending.set(false);
				}
			}
		}

		this.errors.set(errors);
	}
}
