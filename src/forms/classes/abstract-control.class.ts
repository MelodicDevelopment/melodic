import { signal, computed } from '../../signals';
import type { Signal } from '../../signals';
import type { ValidatorFn, AsyncValidatorFn, ValidationErrors, ValidationError, MessageMap, MessageValue } from '../types/validation.types';
import type { ControlState, ControlOptions, SetValueOptions, UpdateOn } from '../types/control.types';
import { getGlobalMessage, resolveMessage } from '../messages/messages-registry';

export abstract class AbstractControl<T = unknown> {
	public readonly value: Signal<T>;
	public readonly errors: Signal<ValidationErrors | null>;

	public dirty!: Signal<boolean>;
	public touched!: Signal<boolean>;
	public pristine!: Signal<boolean>;
	public untouched!: Signal<boolean>;
	public valid!: Signal<boolean>;
	public invalid!: Signal<boolean>;
	public pending!: Signal<boolean>;
	public disabled!: Signal<boolean>;
	public enabled!: Signal<boolean>;
	public state!: Signal<ControlState>;

	public readonly updateOn: UpdateOn;
	public readonly messages: MessageMap;

	public parent: AbstractControl<any> | null = null;

	protected _validators: ValidatorFn<T>[] = [];
	protected _asyncValidators: AsyncValidatorFn<T>[] = [];
	protected readonly _touched = signal<boolean>(false);
	protected readonly _dirty = signal<boolean>(false);
	protected readonly _pending = signal<boolean>(false);
	protected readonly _ownDisabled = signal<boolean>(false);
	protected _asyncValidationId = 0;

	constructor(initialValue: T, options: ControlOptions<T> = {}) {
		this.value = signal<T>(initialValue);
		this.errors = signal<ValidationErrors | null>(null);

		this._validators = options.validators ?? [];
		this._asyncValidators = options.asyncValidators ?? [];
		this._ownDisabled.set(options.disabled ?? false);
		this.updateOn = options.updateOn ?? 'change';
		this.messages = options.messages ?? {};
	}

	protected initializeAggregates(): void {
		this.dirty = computed(() => this.computeDirty());
		this.touched = computed(() => this.computeTouched());
		this.pending = computed(() => this.computePending());
		this.disabled = computed(() => this.computeDisabled());

		this.pristine = computed(() => !this.dirty());
		this.untouched = computed(() => !this.touched());
		this.enabled = computed(() => !this.disabled());
		this.invalid = computed(() => this.errors() !== null || this.hasInvalidChild());
		this.valid = computed(() => !this.invalid() && !this.pending());

		this.state = computed<ControlState>(() => ({
			dirty: this.dirty(),
			touched: this.touched(),
			pristine: !this.dirty(),
			untouched: !this.touched(),
			valid: !this.invalid() && !this.pending(),
			invalid: this.invalid(),
			pending: this.pending(),
			disabled: this.disabled(),
			enabled: !this.disabled()
		}));
	}

	public abstract setValue(value: T, options?: SetValueOptions): void;
	public abstract patchValue(value: unknown, options?: SetValueOptions): void;
	public abstract reset(value?: T): void;
	public abstract destroy(): void;

	public markAsTouched(): void {
		this._touched.set(true);
		if (this.updateOn === 'blur') {
			void this.runValidation();
		}
	}

	public markAsUntouched(): void {
		this._touched.set(false);
	}

	public markAsDirty(): void {
		this._dirty.set(true);
	}

	public markAsPristine(): void {
		this._dirty.set(false);
	}

	public markAllAsTouched(): void {
		this.markAsTouched();
	}

	public markAllAsUntouched(): void {
		this.markAsUntouched();
	}

	public markAllAsDirty(): void {
		this.markAsDirty();
	}

	public markAllAsPristine(): void {
		this.markAsPristine();
	}

	public disable(): void {
		this._ownDisabled.set(true);
	}

	public enable(): void {
		this._ownDisabled.set(false);
	}

	public setValidators(validators: ValidatorFn<T>[]): void {
		this._validators = validators;
		void this.runValidation();
	}

	public addValidators(validators: ValidatorFn<T>[]): void {
		this._validators = [...this._validators, ...validators];
		void this.runValidation();
	}

	public removeValidators(validators: ValidatorFn<T>[]): void {
		this._validators = this._validators.filter((v) => !validators.includes(v));
		void this.runValidation();
	}

	public setAsyncValidators(validators: AsyncValidatorFn<T>[]): void {
		this._asyncValidators = validators;
		void this.runValidation();
	}

	public async validate(): Promise<void> {
		await this.runValidation();
	}

	public getError(code: string): ValidationError | null {
		return this.errors()?.[code] ?? null;
	}

	public hasError(code: string): boolean {
		return this.errors()?.[code] !== undefined;
	}

	public getErrorMessage(code: string): string {
		const error = this.getError(code);
		if (!error) return '';

		const params = error.params;

		const localMessage = this.resolveFromChain(code);
		if (localMessage !== undefined) {
			return resolveMessage(localMessage, params);
		}

		const globalMessage = getGlobalMessage(code);
		if (globalMessage !== undefined) {
			return resolveMessage(globalMessage, params);
		}

		return code;
	}

	public getFirstErrorMessage(): string {
		const errors = this.errors();
		if (!errors) return '';
		const codes = Object.keys(errors);
		if (codes.length === 0) return '';
		return this.getErrorMessage(codes[0]);
	}

	protected resolveFromChain(code: string): MessageValue | undefined {
		let control: AbstractControl<any> | null = this;
		while (control !== null) {
			if (control.messages[code] !== undefined) {
				return control.messages[code];
			}
			control = control.parent;
		}
		return undefined;
	}

	protected async runValidation(): Promise<void> {
		const value = this.value();
		let errors: ValidationErrors | null = null;

		for (const validator of this._validators) {
			const result = validator(value);
			if (result !== null) {
				errors = { ...(errors ?? {}), ...result };
			}
		}

		if (errors !== null) {
			this.errors.set(errors);
			return;
		}

		if (this._asyncValidators.length > 0) {
			const id = ++this._asyncValidationId;
			this._pending.set(true);

			try {
				const results = await Promise.all(this._asyncValidators.map((v) => v(value)));
				if (id !== this._asyncValidationId) return;

				for (const result of results) {
					if (result !== null) {
						errors = { ...(errors ?? {}), ...result };
					}
				}
			} finally {
				if (id === this._asyncValidationId) {
					this._pending.set(false);
				}
			}
		}

		this.errors.set(errors);
	}

	protected computeDirty(): boolean {
		return this._dirty();
	}

	protected computeTouched(): boolean {
		return this._touched();
	}

	protected computePending(): boolean {
		return this._pending();
	}

	protected computeDisabled(): boolean {
		return this._ownDisabled();
	}

	protected hasInvalidChild(): boolean {
		return false;
	}

	protected destroySignals(): void {
		this.value.destroy();
		this.errors.destroy();
		this._touched.destroy();
		this._dirty.destroy();
		this._pending.destroy();
		this._ownDisabled.destroy();
		this.dirty.destroy();
		this.touched.destroy();
		this.pristine.destroy();
		this.untouched.destroy();
		this.valid.destroy();
		this.invalid.destroy();
		this.pending.destroy();
		this.disabled.destroy();
		this.enabled.destroy();
		this.state.destroy();
	}
}
